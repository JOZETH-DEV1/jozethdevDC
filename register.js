// register.js
// Este script se ejecuta UNA SOLA VEZ (o cada vez que cambies los comandos)
// desde tu computadora, NO desde Cloudflare. Sube los comandos a Discord.
//
// Uso:
//   node register.js
//
// Necesita las variables de entorno DISCORD_TOKEN y DISCORD_APPLICATION_ID
// Puedes crear un archivo .env local (no lo subas a git) o exportarlas
// en tu terminal antes de correr el script.

import 'dotenv/config';
import { ALL_COMMANDS } from './commands.js';

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

if (!token || !applicationId) {
  console.error('Faltan DISCORD_TOKEN o DISCORD_APPLICATION_ID en tus variables de entorno.');
  process.exit(1);
}

const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;

const response = await fetch(url, {
  method: 'PUT', // PUT reemplaza TODOS los comandos globales con esta lista
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bot ${token}`,
  },
  body: JSON.stringify(ALL_COMMANDS),
});

if (response.ok) {
  const data = await response.json();
  console.log('✅ Comandos registrados correctamente:');
  data.forEach((cmd) => console.log(`  /${cmd.name}`));
} else {
  console.error('❌ Error registrando comandos:', response.status);
  console.error(await response.text());
}
