import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class UserEcommerceNotFoundError extends NotFoundError {
  readonly code = 'USER_ECOMMERCE_NOT_FOUND';

  constructor(id: string) {
    super(`No existe un usuario ecommerce con id ${id}.`);
  }
}

export class UserEcommerceEmailAlreadyExistsError extends ConflictError {
  readonly code = 'USER_ECOMMERCE_EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`Ya existe un usuario ecommerce registrado con el email ${email}.`);
  }
}

export class UserEcommerceInUseError extends ConflictError {
  readonly code = 'USER_ECOMMERCE_IN_USE';

  constructor(id: string) {
    super(
      `El usuario ecommerce ${id} no se puede eliminar porque esta referenciado en ventas registradas. ` +
        'Desactivalo con PATCH /users-ecommerce/{id} enviando "userActive": false.',
    );
  }
}
