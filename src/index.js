// src/index.js
// Worker de Cloudflare para jozethdevBot.
// Maneja los slash commands: /ban, /kick, /aislar, /unban
//
// IMPORTANTE: este Worker SOLO responde a interacciones (slash commands).
// No puede leer mensajes normales del chat ni detectar cuando alguien se une:
// eso lo hace el bot Node.js aparte (carpeta bot-node/).

import { verifyKey } from 'discord-interactions';

const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
};

const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
};

// Helper para responder con un mensaje efímero (solo lo ve quien ejecutó el comando)
function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function ephemeralMessage(content) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: 64, // EPHEMERAL
    },
  };
}

// Extrae el ID del usuario objetivo y la razón de las opciones del comando
function getOption(options, name) {
  if (!options) return undefined;
  const found = options.find((opt) => opt.name === name);
  return found ? found.value : undefined;
}

async function discordApiFetch(env, path, options = {}) {
  return fetch(`https://discord.com/api/v10${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

async function handleBan(interaction, env) {
  const guildId = interaction.guild_id;
  const options = interaction.data.options;
  const userId = getOption(options, 'usuario');
  const razon = getOption(options, 'razon') || 'Sin razón especificada';

  const res = await discordApiFetch(env, `/guilds/${guildId}/bans/${userId}`, {
    method: 'PUT',
    headers: {
      'X-Audit-Log-Reason': razon,
    },
    body: JSON.stringify({ delete_message_seconds: 0 }),
  });

  if (res.ok) {
    return ephemeralMessage(`✅ Usuario <@${userId}> baneado. Razón: ${razon}`);
  }
  const errText = await res.text();
  return ephemeralMessage(`❌ No pude banear a <@${userId}>. Verifica que mi rol esté por encima del suyo y que tenga el permiso "Banear miembros". (${res.status})`);
}

async function handleUnban(interaction, env) {
  const guildId = interaction.guild_id;
  const options = interaction.data.options;
  const userId = getOption(options, 'id');

  const res = await discordApiFetch(env, `/guilds/${guildId}/bans/${userId}`, {
    method: 'DELETE',
  });

  if (res.ok) {
    return ephemeralMessage(`✅ Usuario con ID \`${userId}\` desbaneado.`);
  }
  return ephemeralMessage(`❌ No pude desbanear ese ID. Verifica que esté baneado y que el ID sea correcto. (${res.status})`);
}

async function handleKick(interaction, env) {
  const guildId = interaction.guild_id;
  const options = interaction.data.options;
  const userId = getOption(options, 'usuario');
  const razon = getOption(options, 'razon') || 'Sin razón especificada';

  const res = await discordApiFetch(env, `/guilds/${guildId}/members/${userId}`, {
    method: 'DELETE',
    headers: {
      'X-Audit-Log-Reason': razon,
    },
  });

  if (res.ok) {
    return ephemeralMessage(`✅ Usuario <@${userId}> expulsado. Razón: ${razon}`);
  }
  return ephemeralMessage(`❌ No pude expulsar a <@${userId}>. Verifica permisos y jerarquía de roles. (${res.status})`);
}

async function handleTimeout(interaction, env) {
  const guildId = interaction.guild_id;
  const options = interaction.data.options;
  const userId = getOption(options, 'usuario');
  const minutos = getOption(options, 'minutos');
  const razon = getOption(options, 'razon') || 'Sin razón especificada';

  const maxMinutos = 40320; // 28 días, límite de Discord
  const minutosFinal = Math.min(minutos, maxMinutos);
  const until = new Date(Date.now() + minutosFinal * 60 * 1000).toISOString();

  const res = await discordApiFetch(env, `/guilds/${guildId}/members/${userId}`, {
    method: 'PATCH',
    headers: {
      'X-Audit-Log-Reason': razon,
    },
    body: JSON.stringify({ communication_disabled_until: until }),
  });

  if (res.ok) {
    return ephemeralMessage(`✅ Usuario <@${userId}> aislado por ${minutosFinal} minutos. Razón: ${razon}`);
  }
  return ephemeralMessage(`❌ No pude aislar a <@${userId}>. Verifica permisos. (${res.status})`);
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Este endpoint solo acepta solicitudes de Discord.', { status: 405 });
    }

    // 1. Verificar la firma de la solicitud (obligatorio, si no Discord la rechaza)
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    const isValid = signature && timestamp && await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
      return new Response('Firma inválida', { status: 401 });
    }

    const interaction = JSON.parse(body);

    // 2. Discord manda un PING de vez en cuando para verificar que el endpoint vive
    if (interaction.type === InteractionType.PING) {
      return jsonResponse({ type: InteractionResponseType.PONG });
    }

    // 3. Manejar los slash commands
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const commandName = interaction.data.name;

      try {
        let responseData;
        switch (commandName) {
          case 'ban':
            responseData = await handleBan(interaction, env);
            break;
          case 'unban':
            responseData = await handleUnban(interaction, env);
            break;
          case 'kick':
            responseData = await handleKick(interaction, env);
            break;
          case 'aislar':
            responseData = await handleTimeout(interaction, env);
            break;
          default:
            responseData = ephemeralMessage('Comando no reconocido.');
        }
        return jsonResponse(responseData);
      } catch (err) {
        return jsonResponse(ephemeralMessage(`❌ Ocurrió un error inesperado: ${err.message}`));
      }
    }

    return new Response('Tipo de interacción no soportado', { status: 400 });
  },
};
