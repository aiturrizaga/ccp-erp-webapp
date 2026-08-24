import { Customer, Contact, Lead, Opportunity } from '@core/models';

export const CUSTOMERS: Customer[] = [
  { id: 'CUS-001', legalName: 'ELECTRO SUR ESTE S.A.A.', taxId: '20259531364', address: 'Av. Circunvalación 1512, Wanchaq, Cusco', paymentTerms: 'CREDITO A 30 DIAS', currency: 'PEN', commercialTerms: 'Contrato marco anual con precios escalonados por volumen' },
  { id: 'CUS-002', legalName: 'CONSTRUCTORA MOVICA S.A.C.', taxId: '20512834109', address: 'Av. Aviación 4820, Surquillo, Lima', paymentTerms: 'CREDITO A 45 DIAS', currency: 'PEN', commercialTerms: 'Precios por proyecto, sujetos a licitación pública' },
  { id: 'CUS-003', legalName: 'MUNICIPALIDAD DISTRITAL DE SAN JUAN DE LURIGANCHO', taxId: '20131378972', address: 'Av. Próceres de la Independencia 1547, SJL, Lima', paymentTerms: 'CREDITO A 60 DIAS', currency: 'PEN', commercialTerms: 'Compra vía OSCE, orden de compra contra presupuesto aprobado' },
  { id: 'CUS-004', legalName: 'DISTRIBUIDORA ELECTRICA DEL NORTE S.A.C.', taxId: '20487215630', address: 'Carretera Panamericana Norte Km 785, Chiclayo', paymentTerms: 'CREDITO A 30 DIAS', currency: 'PEN', commercialTerms: 'Descuento por pronto pago 2% a 10 días' },
  { id: 'CUS-005', legalName: 'ELECTRICISTAS ASOCIADOS DEL CENTRO E.I.R.L.', taxId: '20601887453', address: 'Jr. Huánuco 340, El Tambo, Huancayo', paymentTerms: 'CONTADO', currency: 'PEN', commercialTerms: 'Sin línea de crédito, pago contra entrega' },
  { id: 'CUS-006', legalName: 'CONSORCIO VIAL RUTAS DEL SUR S.A.', taxId: '20548672190', address: 'Av. Ejército 1120, Yanahuara, Arequipa', paymentTerms: 'CREDITO A 30 DIAS', currency: 'PEN', commercialTerms: 'Suministro programado por hitos de obra' },
  { id: 'CUS-007', legalName: 'TELECOMUNICACIONES ANDINAS S.A.C.', taxId: '20601345872', address: 'Av. Javier Prado Este 3890, San Borja, Lima', paymentTerms: 'CREDITO A 30 DIAS', currency: 'USD', commercialTerms: 'Facturación en USD, ajuste anual por inflación' },
  { id: 'CUS-008', legalName: 'MUNICIPALIDAD PROVINCIAL DE CAJAMARCA', taxId: '20131715984', address: 'Jr. Cruz de Piedra 613, Cajamarca', paymentTerms: 'CREDITO A 60 DIAS', currency: 'PEN', commercialTerms: 'Compra vía OSCE, requiere garantía de fiel cumplimiento' },
  { id: 'CUS-009', legalName: 'INSTALACIONES ELECTRICAS DEL PACIFICO S.A.C.', taxId: '20603312487', address: 'Av. Náñez 210, Cercado, Trujillo', paymentTerms: 'CREDITO A 15 DIAS', currency: 'PEN', commercialTerms: 'Línea de crédito revisada semestralmente' },
];

export const CONTACTS: Contact[] = [
  { id: 'CON-001', customerId: 'CUS-001', name: 'Marco Quispe Huamán', position: 'Jefe de Logística', email: 'mquispe@electrosureste.com.pe', phone: '084 224 400' },
  { id: 'CON-002', customerId: 'CUS-001', name: 'Rocío Salas Ttito', position: 'Analista de Compras', email: 'rsalas@electrosureste.com.pe', phone: '084 224 401' },
  { id: 'CON-003', customerId: 'CUS-002', name: 'Iván Chumpitaz Rojas', position: 'Gerente de Proyectos', email: 'ichumpitaz@movica.pe', phone: '01 445 8820' },
  { id: 'CON-004', customerId: 'CUS-003', name: 'Katherine Loayza Del Águila', position: 'Subgerente de Obras Públicas', email: 'kloayza@munisjl.gob.pe', phone: '01 459 7200' },
  { id: 'CON-005', customerId: 'CUS-004', name: 'Segundo Vílchez Cotrina', position: 'Jefe de Almacén', email: 'svilchez@edelnor-norte.pe', phone: '074 234 010' },
  { id: 'CON-006', customerId: 'CUS-005', name: 'Yolanda Fernández Espinoza', position: 'Propietaria', email: 'yfernandez@electricistascentro.pe', phone: '064 219 340' },
  { id: 'CON-007', customerId: 'CUS-006', name: 'Percy Alanoca Mamani', position: 'Residente de Obra', email: 'palanoca@rutasdelsur.pe', phone: '054 271 990' },
  { id: 'CON-008', customerId: 'CUS-007', name: 'Diego Bustamante Ríos', position: 'Gerente de Infraestructura', email: 'dbustamante@telecomandinas.pe', phone: '01 611 2200' },
  { id: 'CON-009', customerId: 'CUS-008', name: 'Fiorella Terán Vásquez', position: 'Especialista en Adquisiciones', email: 'fteran@municaj.gob.pe', phone: '076 362 850' },
  { id: 'CON-010', customerId: 'CUS-009', name: 'Walter Cabrera Ponte', position: 'Jefe de Operaciones', email: 'wcabrera@instalpacifico.pe', phone: '044 271 630' },
];

export const LEADS: Lead[] = [
  { id: 'LEA-001', contactName: 'Renzo Ibáñez Cárdenas', company: 'CONSTRUCTORA VIAS DEL NORTE S.A.C.', email: 'ribanez@viasdelnorte.pe', phone: '074 228 615', source: 'trade_show', status: 'new', createdAt: '2026-08-05', notes: 'Contacto en Expo Concreto 2026, interesado en postes de 13m para línea de media tensión.' },
  { id: 'LEA-002', contactName: 'Milagros Peña Suárez', company: 'MUNICIPALIDAD DISTRITAL DE VENTANILLA', email: 'mpena@muniventanilla.gob.pe', phone: '01 452 9010', source: 'web', status: 'contacted', createdAt: '2026-07-28', notes: 'Solicitó cotización referencial para expediente técnico de alumbrado público.' },
  { id: 'LEA-003', contactName: 'Julio César Farfán', company: 'ELECTROMONTAJES DEL ORIENTE E.I.R.L.', email: 'jfarfan@electromontajesoriente.pe', phone: '065 231 480', source: 'referral', status: 'qualified', createdAt: '2026-07-15', notes: 'Referido por Distribuidora Eléctrica del Norte. Requiere postes CAC 11m y 9m para proyecto en Iquitos.' },
  { id: 'LEA-004', contactName: 'Carmen Rosa Delgado', company: 'INVERSIONES ENERGETICAS DEL SUR S.A.C.', email: 'cdelgado@ienergeticas.pe', phone: '054 284 730', source: 'call', status: 'new', createdAt: '2026-08-12' },
  { id: 'LEA-005', contactName: 'Fernando Alva Rimarachín', company: 'CONSORCIO ELECTRIFICACION RURAL CAJAMARCA', email: 'falva@cerc.pe', phone: '076 341 220', source: 'referral', status: 'contacted', createdAt: '2026-08-01', notes: 'Proyecto de electrificación rural, requiere volumen alto de postes CAC 8m.' },
  { id: 'LEA-006', contactName: 'Ana Lucía Ponce', company: 'MUNICIPALIDAD PROVINCIAL DE HUARAL', email: 'aponce@munihuaral.gob.pe', phone: '01 246 1180', source: 'web', status: 'discarded', createdAt: '2026-06-20', notes: 'Presupuesto insuficiente para el volumen solicitado, proyecto postergado.' },
  { id: 'LEA-007', contactName: 'Ricardo Mendoza Solano', company: 'CONTRATISTAS ELECTRICOS DEL CALLAO S.A.C.', email: 'rmendoza@cecallao.pe', phone: '01 429 5510', source: 'trade_show', status: 'qualified', createdAt: '2026-07-22', notes: 'Necesita postes ornamentales para alumbrado en malecón, presupuesto ya aprobado.' },
  { id: 'LEA-008', contactName: 'Gustavo Rojas Peralta', company: 'ENERGIA Y REDES DEL PERU S.A.C.', email: 'grojas@energiayredes.pe', phone: '01 618 3300', source: 'other', status: 'new', createdAt: '2026-08-18', notes: 'Contactado vía LinkedIn por campaña de marketing.' },
  { id: 'LEA-009', contactName: 'Doris Salazar Vega', company: 'MUNICIPALIDAD DISTRITAL DE PAUCARPATA', email: 'dsalazar@munipaucarpata.gob.pe', phone: '054 461 220', source: 'call', status: 'contacted', createdAt: '2026-08-09' },
];

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'OPP-001', title: 'Suministro postes CAC 13m - Línea MT Cusco Norte', customerId: 'CUS-001', expectedAmount: 148500, currency: 'PEN', stage: 'negotiation', estimatedCloseDate: '2026-09-10', salesRep: 'Patricia Núñez (Ventas)',
    activities: [
      { date: '2026-07-02', user: 'Patricia Núñez', action: 'Oportunidad creada', detail: 'Originada desde contrato marco vigente.' },
      { date: '2026-07-18', user: 'Patricia Núñez', action: 'Cotización enviada', detail: 'Cotización COT-2026-0341 por 220 postes CAC 13m.' },
      { date: '2026-08-10', user: 'Marco Quispe (Electro Sur Este)', action: 'Solicitó ajuste de precio', detail: 'Pide revisar precio unitario por volumen adicional.' },
    ],
  },
  {
    id: 'OPP-002', title: 'Postes ornamentales malecón Callao', customerId: 'CUS-004', expectedAmount: 62800, currency: 'PEN', stage: 'proposal', estimatedCloseDate: '2026-09-25', salesRep: 'Diego Farfán (Ventas)',
    activities: [
      { date: '2026-07-25', user: 'Diego Farfán', action: 'Oportunidad creada' },
      { date: '2026-08-05', user: 'Diego Farfán', action: 'Visita técnica realizada', detail: 'Levantamiento de medidas en campo junto al cliente.' },
      { date: '2026-08-15', user: 'Diego Farfán', action: 'Propuesta enviada', detail: 'Propuesta técnico-económica PROP-2026-118.' },
    ],
  },
  {
    id: 'OPP-003', title: 'Electrificación rural Cajamarca - Postes CAC 8m', customerId: 'CUS-008', expectedAmount: 385000, currency: 'PEN', stage: 'qualified', estimatedCloseDate: '2026-10-30', salesRep: 'Patricia Núñez (Ventas)',
    activities: [
      { date: '2026-08-01', user: 'Patricia Núñez', action: 'Oportunidad creada', detail: 'Derivada del lead LEA-005.' },
      { date: '2026-08-14', user: 'Patricia Núñez', action: 'Reunión de calificación', detail: 'Cliente confirmó partida presupuestal aprobada.' },
    ],
  },
  {
    id: 'OPP-004', title: 'Suministro anual postes viales Consorcio Vial Rutas del Sur', customerId: 'CUS-006', expectedAmount: 210300, currency: 'PEN', stage: 'won', estimatedCloseDate: '2026-06-30', salesRep: 'Diego Farfán (Ventas)',
    activities: [
      { date: '2026-04-10', user: 'Diego Farfán', action: 'Oportunidad creada' },
      { date: '2026-05-20', user: 'Diego Farfán', action: 'Negociación cerrada', detail: 'Precio final acordado con 3% de descuento por volumen.' },
      { date: '2026-06-28', user: 'Diego Farfán', action: 'Oportunidad ganada', detail: 'Orden de compra OC-2026-0219 recibida.' },
    ],
  },
  {
    id: 'OPP-005', title: 'Postes tensados Telecomunicaciones Andinas', customerId: 'CUS-007', expectedAmount: 94200, currency: 'USD', stage: 'contacted', estimatedCloseDate: '2026-11-15', salesRep: 'Patricia Núñez (Ventas)',
    activities: [
      { date: '2026-08-11', user: 'Patricia Núñez', action: 'Oportunidad creada' },
      { date: '2026-08-19', user: 'Patricia Núñez', action: 'Primer contacto', detail: 'Llamada con Diego Bustamante para entender alcance del proyecto de fibra.' },
    ],
  },
  {
    id: 'OPP-006', title: 'Alumbrado público San Juan de Lurigancho - Fase 2', customerId: 'CUS-003', expectedAmount: 275600, currency: 'PEN', stage: 'new', estimatedCloseDate: '2026-12-05', salesRep: 'Diego Farfán (Ventas)',
    activities: [{ date: '2026-08-20', user: 'Diego Farfán', action: 'Oportunidad creada', detail: 'A la espera de bases del proceso OSCE.' }],
  },
  {
    id: 'OPP-007', title: 'Postes CAC 9m - Instalaciones Eléctricas del Pacífico', customerId: 'CUS-009', expectedAmount: 45900, currency: 'PEN', stage: 'lost', estimatedCloseDate: '2026-07-15', salesRep: 'Patricia Núñez (Ventas)',
    activities: [
      { date: '2026-06-01', user: 'Patricia Núñez', action: 'Oportunidad creada' },
      { date: '2026-07-14', user: 'Patricia Núñez', action: 'Oportunidad perdida', detail: 'Cliente optó por proveedor con menor plazo de entrega.' },
    ],
  },
  {
    id: 'OPP-008', title: 'Reposición postes dañados - Distribuidora Eléctrica del Norte', customerId: 'CUS-004', expectedAmount: 38700, currency: 'PEN', stage: 'negotiation', estimatedCloseDate: '2026-09-05', salesRep: 'Diego Farfán (Ventas)',
    activities: [
      { date: '2026-08-02', user: 'Diego Farfán', action: 'Oportunidad creada', detail: 'Reposición por daños de temporada de lluvias.' },
      { date: '2026-08-17', user: 'Diego Farfán', action: 'Negociación de plazos', detail: 'Cliente solicita entrega fraccionada en 3 lotes.' },
    ],
  },
  {
    id: 'OPP-009', title: 'Postes CAC 11m - Electromontajes del Oriente', customerId: 'CUS-005', expectedAmount: 128400, currency: 'PEN', stage: 'qualified', estimatedCloseDate: '2026-10-10', salesRep: 'Patricia Núñez (Ventas)',
    activities: [
      { date: '2026-08-16', user: 'Patricia Núñez', action: 'Oportunidad creada', detail: 'Derivada del lead LEA-003 tras calificación.' },
    ],
  },
  {
    id: 'OPP-010', title: 'Ampliación red eléctrica Consorcio Vial Rutas del Sur', customerId: 'CUS-006', expectedAmount: 167300, currency: 'PEN', stage: 'proposal', estimatedCloseDate: '2026-10-20', salesRep: 'Diego Farfán (Ventas)',
    activities: [
      { date: '2026-07-30', user: 'Diego Farfán', action: 'Oportunidad creada' },
      { date: '2026-08-13', user: 'Diego Farfán', action: 'Propuesta enviada', detail: 'Propuesta técnico-económica PROP-2026-122.' },
    ],
  },
];
