import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ProjectEntity } from '../orm/project.entity';
import { ProjectTaskEntity } from '../orm/project-task.entity';
import { ProjectExpenseEntity } from '../orm/project-expense.entity';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    @InjectRepository(ProjectEntity)    private readonly projects: Repository<ProjectEntity>,
    @InjectRepository(ProjectTaskEntity) private readonly tasks: Repository<ProjectTaskEntity>,
    @InjectRepository(ProjectExpenseEntity) private readonly expenses: Repository<ProjectExpenseEntity>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  /* ─── PROYECTOS ──────────────────────────────────────────────────── */

  @Get()
  @ApiOperation({ summary: 'Listar proyectos' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  async list(
    @Query('status') status?: string,
    @Query('page')   page  = '1',
    @Query('limit')  limit = '20',
  ) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;
    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (status) where.status = status;

    const [items, total] = await this.projects.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    const ids = items.map((p) => p.projectId);
    if (ids.length) {
      const expenses = await this.ds.query<{ project_id: string; actual_cost: string }[]>(
        `SELECT project_id, COALESCE(SUM(amount),0)::TEXT AS actual_cost
           FROM project_expenses WHERE project_id = ANY($1) GROUP BY project_id`,
        [ids],
      );
      const expMap = Object.fromEntries(expenses.map((e) => [e.project_id, e.actual_cost]));
      items.forEach((p: any) => { p.actualCost = expMap[p.projectId] ?? '0'; });
    }
    return { items, meta: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de proyecto con tareas y gastos' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const project = await this.projects.findOneOrFail({
      where: { projectId: id, deletedAt: IsNull() },
      relations: ['tasks', 'expenses'],
    });
    const [expenseSum] = await this.ds.query<{ actual_cost: string }[]>(
      `SELECT COALESCE(SUM(amount),0)::TEXT AS actual_cost FROM project_expenses WHERE project_id = $1`,
      [id],
    );
    return { ...project, actualCost: expenseSum.actual_cost };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear proyecto' })
  async create(@Body() body: Partial<ProjectEntity>, @Req() req: any) {
    const project = this.projects.create({ ...body, createdBy: req.user?.email ?? 'system' });
    return this.projects.save(project);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<ProjectEntity>) {
    await this.projects.update(id, body);
    return this.projects.findOneOrFail({ where: { projectId: id } });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar proyecto (soft-delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.projects.softDelete(id);
  }

  /* ─── TAREAS ─────────────────────────────────────────────────────── */

  @Get(':id/tasks')
  async listTasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.find({ where: { projectId: id }, order: { createdAt: 'ASC' } });
  }

  @Post(':id/tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<ProjectTaskEntity>) {
    const task = this.tasks.create({ ...body, projectId: id });
    return this.tasks.save(task);
  }

  @Patch('tasks/:taskId')
  async updateTask(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() body: Partial<ProjectTaskEntity>) {
    const patch: Partial<ProjectTaskEntity> = { ...body };
    if (body.status === 'done' && !body.completedAt) patch.completedAt = new Date();
    await this.tasks.update(taskId, patch);
    return this.tasks.findOneOrFail({ where: { taskId } });
  }

  @Delete('tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    await this.tasks.delete(taskId);
  }

  /* ─── GASTOS ─────────────────────────────────────────────────────── */

  @Get(':id/expenses')
  async listExpenses(@Param('id', ParseUUIDPipe) id: string) {
    return this.expenses.find({ where: { projectId: id }, order: { expenseDate: 'DESC' } });
  }

  @Post(':id/expenses')
  @HttpCode(HttpStatus.CREATED)
  async createExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<ProjectExpenseEntity>,
    @Req() req: any,
  ) {
    const expense = this.expenses.create({ ...body, projectId: id, createdBy: req.user?.email ?? 'system' });
    return this.expenses.save(expense);
  }

  @Delete('expenses/:expId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExpense(@Param('expId', ParseUUIDPipe) expId: string) {
    await this.expenses.delete(expId);
  }
}
