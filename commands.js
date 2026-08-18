// commands.js
// Define aquí los slash commands. Este archivo se usa para REGISTRAR
// los comandos en Discord (una sola vez, con register.js) y el worker
// los lee para saber a qué comando responder.

export const BAN_COMMAND = {
  name: 'ban',
  description: 'Banea a un usuario del servidor',
  options: [
    {
      name: 'usuario',
      description: 'El usuario que quieres banear',
      type: 6, // USER type
      required: true,
    },
    {
      name: 'razon',
      description: 'Razón del baneo (opcional)',
      type: 3, // STRING type
      required: false,
    },
  ],
  default_member_permissions: '4', // Requiere permiso BAN_MEMBERS por defecto
};

export const KICK_COMMAND = {
  name: 'kick',
  description: 'Expulsa a un usuario del servidor',
  options: [
    {
      name: 'usuario',
      description: 'El usuario que quieres expulsar',
      type: 6,
      required: true,
    },
    {
      name: 'razon',
      description: 'Razón de la expulsión (opcional)',
      type: 3,
      required: false,
    },
  ],
  default_member_permissions: '2', // KICK_MEMBERS
};

export const TIMEOUT_COMMAND = {
  name: 'aislar',
  description: 'Aísla (timeout) a un usuario por un tiempo determinado',
  options: [
    {
      name: 'usuario',
      description: 'El usuario a aislar',
      type: 6,
      required: true,
    },
    {
      name: 'minutos',
      description: 'Minutos de aislamiento (máx 40320 = 28 días)',
      type: 4, // INTEGER
      required: true,
    },
    {
      name: 'razon',
      description: 'Razón (opcional)',
      type: 3,
      required: false,
    },
  ],
  default_member_permissions: '8796093022208', // MODERATE_MEMBERS
};

export const UNBAN_COMMAND = {
  name: 'unban',
  description: 'Desbanea a un usuario usando su ID',
  options: [
    {
      name: 'id',
      description: 'El ID de Discord del usuario a desbanear',
      type: 3,
      required: true,
    },
  ],
  default_member_permissions: '4',
};

export const ALL_COMMANDS = [BAN_COMMAND, KICK_COMMAND, TIMEOUT_COMMAND, UNBAN_COMMAND];
