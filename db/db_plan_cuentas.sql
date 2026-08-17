-- Plan de Cuentas (PCGE - Plan Contable General Empresarial, Peru)
-- Ejecutar una sola vez.

CREATE TABLE IF NOT EXISTS accounts (
  account_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(10)  NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  type        VARCHAR(20)  NOT NULL CHECK (type IN ('activo','pasivo','patrimonio','ingresos','gastos','orden')),
  parent_code VARCHAR(10)  REFERENCES accounts(code) ON DELETE SET NULL,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_accounts_code        ON accounts (code);
CREATE INDEX IF NOT EXISTS idx_accounts_parent_code ON accounts (parent_code);
CREATE INDEX IF NOT EXISTS idx_accounts_not_deleted ON accounts (account_id) WHERE deleted_at IS NULL;

-- ── Semilla: cuentas de primer y segundo nivel del PCGE ─────────────────────

INSERT INTO accounts (account_id, code, name, type, parent_code) VALUES
-- ELEMENTO 1: ACTIVO DISPONIBLE Y EXIGIBLE
  (gen_random_uuid(), '10',   'Efectivo y equivalentes de efectivo',              'activo',    NULL),
  (gen_random_uuid(), '1011', 'Caja',                                              'activo',    '10'),
  (gen_random_uuid(), '1012', 'Fondos fijos',                                      'activo',    '10'),
  (gen_random_uuid(), '1041', 'Cuentas corrientes operativas',                      'activo',    '10'),
  (gen_random_uuid(), '1042', 'Cuentas corrientes para fines especificos',          'activo',    '10'),
  (gen_random_uuid(), '12',   'Cuentas por cobrar comerciales - Terceros',          'activo',    NULL),
  (gen_random_uuid(), '1211', 'Facturas, boletas y otros comprobantes por cobrar',  'activo',    '12'),
  (gen_random_uuid(), '1212', 'Letras por cobrar',                                  'activo',    '12'),
  (gen_random_uuid(), '14',   'Cuentas por cobrar al personal, acc. socios, dir.', 'activo',    NULL),
  (gen_random_uuid(), '16',   'Cuentas por cobrar diversas - Terceros',             'activo',    NULL),
  (gen_random_uuid(), '18',   'Servicios y otros contratados por anticipado',       'activo',    NULL),
  (gen_random_uuid(), '19',   'Estimacion de cuentas de cobranza dudosa',           'activo',    NULL),

-- ELEMENTO 2: ACTIVO REALIZABLE
  (gen_random_uuid(), '20',   'Mercaderias',                                        'activo',    NULL),
  (gen_random_uuid(), '2011', 'Mercaderias manufacturadas',                          'activo',    '20'),
  (gen_random_uuid(), '2012', 'Mercaderias - servicios',                             'activo',    '20'),
  (gen_random_uuid(), '21',   'Productos terminados',                                'activo',    NULL),
  (gen_random_uuid(), '22',   'Subproductos, desechos y desperdicios',               'activo',    NULL),
  (gen_random_uuid(), '23',   'Productos en proceso',                                'activo',    NULL),
  (gen_random_uuid(), '24',   'Materias primas',                                     'activo',    NULL),
  (gen_random_uuid(), '25',   'Materiales auxiliares, suministros y repuestos',      'activo',    NULL),
  (gen_random_uuid(), '26',   'Envases y embalajes',                                 'activo',    NULL),
  (gen_random_uuid(), '27',   'Activos no corrientes mantenidos para la venta',      'activo',    NULL),
  (gen_random_uuid(), '28',   'Existencias por recibir',                             'activo',    NULL),
  (gen_random_uuid(), '29',   'Desvalorizacion de existencias',                      'activo',    NULL),

-- ELEMENTO 3: ACTIVO INMOVILIZADO
  (gen_random_uuid(), '30',   'Inversiones mobiliarias',                             'activo',    NULL),
  (gen_random_uuid(), '31',   'Inversiones inmobiliarias',                           'activo',    NULL),
  (gen_random_uuid(), '32',   'Activos adq. en arrendamiento financiero',            'activo',    NULL),
  (gen_random_uuid(), '33',   'Inmuebles, maquinaria y equipo',                      'activo',    NULL),
  (gen_random_uuid(), '3311', 'Terrenos',                                             'activo',    '33'),
  (gen_random_uuid(), '3312', 'Edificaciones',                                        'activo',    '33'),
  (gen_random_uuid(), '3341', 'Maquinaria y equipo de explotacion',                   'activo',    '33'),
  (gen_random_uuid(), '3351', 'Muebles y enseres',                                    'activo',    '33'),
  (gen_random_uuid(), '3361', 'Equipos de computo',                                   'activo',    '33'),
  (gen_random_uuid(), '3371', 'Unidades de transporte',                               'activo',    '33'),
  (gen_random_uuid(), '34',   'Intangibles',                                          'activo',    NULL),
  (gen_random_uuid(), '35',   'Activos biologicos',                                   'activo',    NULL),
  (gen_random_uuid(), '36',   'Desvalorizacion de activo inmovilizado',               'activo',    NULL),
  (gen_random_uuid(), '37',   'Activo diferido',                                      'activo',    NULL),
  (gen_random_uuid(), '38',   'Otros activos',                                        'activo',    NULL),
  (gen_random_uuid(), '39',   'Depreciacion, amortizacion y agotamiento acumulado',   'activo',    NULL),

-- ELEMENTO 4: PASIVO
  (gen_random_uuid(), '40',   'Tributos, contraprestaciones y aportes por pagar',     'pasivo',    NULL),
  (gen_random_uuid(), '4011', 'Impuesto general a las ventas',                        'pasivo',    '40'),
  (gen_random_uuid(), '4012', 'Impuesto selectivo al consumo',                        'pasivo',    '40'),
  (gen_random_uuid(), '4017', 'Impuesto a la renta',                                  'pasivo',    '40'),
  (gen_random_uuid(), '4031', 'Essalud',                                               'pasivo',    '40'),
  (gen_random_uuid(), '4032', 'ONP',                                                   'pasivo',    '40'),
  (gen_random_uuid(), '41',   'Remuneraciones y participaciones por pagar',            'pasivo',    NULL),
  (gen_random_uuid(), '42',   'Cuentas por pagar comerciales - Terceros',              'pasivo',    NULL),
  (gen_random_uuid(), '4211', 'Facturas, boletas y otros comprobantes por pagar',      'pasivo',    '42'),
  (gen_random_uuid(), '4212', 'Letras por pagar',                                      'pasivo',    '42'),
  (gen_random_uuid(), '43',   'Cuentas por pagar comerciales - Relacionadas',          'pasivo',    NULL),
  (gen_random_uuid(), '44',   'Cuentas por pagar a los accionistas, socios o dir.',   'pasivo',    NULL),
  (gen_random_uuid(), '45',   'Obligaciones financieras',                              'pasivo',    NULL),
  (gen_random_uuid(), '46',   'Cuentas por pagar diversas - Terceros',                 'pasivo',    NULL),
  (gen_random_uuid(), '47',   'Cuentas por pagar diversas - Relacionadas',             'pasivo',    NULL),
  (gen_random_uuid(), '48',   'Provisiones',                                           'pasivo',    NULL),
  (gen_random_uuid(), '49',   'Pasivo diferido',                                       'pasivo',    NULL),

-- ELEMENTO 5: PATRIMONIO
  (gen_random_uuid(), '50',   'Capital',                                               'patrimonio', NULL),
  (gen_random_uuid(), '51',   'Acciones de inversion',                                 'patrimonio', NULL),
  (gen_random_uuid(), '52',   'Capital adicional',                                     'patrimonio', NULL),
  (gen_random_uuid(), '56',   'Resultados no realizados',                              'patrimonio', NULL),
  (gen_random_uuid(), '57',   'Excedente de revaluacion',                              'patrimonio', NULL),
  (gen_random_uuid(), '58',   'Reservas',                                              'patrimonio', NULL),
  (gen_random_uuid(), '59',   'Resultados acumulados',                                 'patrimonio', NULL),

-- ELEMENTO 6: GASTOS POR NATURALEZA
  (gen_random_uuid(), '60',   'Compras',                                               'gastos',    NULL),
  (gen_random_uuid(), '6011', 'Mercaderias',                                            'gastos',    '60'),
  (gen_random_uuid(), '6012', 'Materias primas',                                        'gastos',    '60'),
  (gen_random_uuid(), '61',   'Variacion de existencias',                               'gastos',    NULL),
  (gen_random_uuid(), '62',   'Gastos de personal, directores y gerentes',              'gastos',    NULL),
  (gen_random_uuid(), '6211', 'Sueldos y salarios',                                     'gastos',    '62'),
  (gen_random_uuid(), '63',   'Gastos de servicios prestados por terceros',             'gastos',    NULL),
  (gen_random_uuid(), '64',   'Gastos por tributos',                                    'gastos',    NULL),
  (gen_random_uuid(), '65',   'Otros gastos de gestion',                                'gastos',    NULL),
  (gen_random_uuid(), '66',   'Perdida por medicion de activos no financieros al VR',  'gastos',    NULL),
  (gen_random_uuid(), '67',   'Gastos financieros',                                     'gastos',    NULL),
  (gen_random_uuid(), '68',   'Valuacion y deterioro de activos y provisiones',         'gastos',    NULL),
  (gen_random_uuid(), '69',   'Costo de ventas',                                        'gastos',    NULL),
  (gen_random_uuid(), '6911', 'Costo de ventas - Mercaderias',                          'gastos',    '69'),

-- ELEMENTO 7: INGRESOS
  (gen_random_uuid(), '70',   'Ventas',                                                 'ingresos',  NULL),
  (gen_random_uuid(), '7011', 'Mercaderias',                                             'ingresos',  '70'),
  (gen_random_uuid(), '7012', 'Productos terminados',                                    'ingresos',  '70'),
  (gen_random_uuid(), '7021', 'Bienes - Ventas a relacionadas',                          'ingresos',  '70'),
  (gen_random_uuid(), '71',   'Variacion de la produccion almacenada',                  'ingresos',  NULL),
  (gen_random_uuid(), '72',   'Produccion de activo inmovilizado',                      'ingresos',  NULL),
  (gen_random_uuid(), '73',   'Descuentos, rebajas y bonificaciones obtenidos',         'ingresos',  NULL),
  (gen_random_uuid(), '74',   'Descuentos, rebajas y bonificaciones concedidos',        'ingresos',  NULL),
  (gen_random_uuid(), '75',   'Otros ingresos de gestion',                              'ingresos',  NULL),
  (gen_random_uuid(), '76',   'Ganancia por medicion de activos no financieros al VR', 'ingresos',  NULL),
  (gen_random_uuid(), '77',   'Ingresos financieros',                                   'ingresos',  NULL),
  (gen_random_uuid(), '78',   'Cargas cubiertas por provisiones',                       'ingresos',  NULL),
  (gen_random_uuid(), '79',   'Cargas imputables a cuentas de costos y gastos',        'ingresos',  NULL),

-- ELEMENTO 0: CUENTAS DE ORDEN
  (gen_random_uuid(), '01',   'Bienes y valores entregados',                            'orden',     NULL),
  (gen_random_uuid(), '02',   'Bienes y valores recibidos',                             'orden',     NULL),
  (gen_random_uuid(), '03',   'Otras cuentas de orden deudoras',                        'orden',     NULL),
  (gen_random_uuid(), '04',   'Otras cuentas de orden acreedoras',                      'orden',     NULL)

ON CONFLICT (code) DO NOTHING;
