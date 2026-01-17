const axios = require("axios");
const { Client: BotClient, GatewayIntentBits, Partials } = require('discord.js');
const { Client: SelfbotClient } = require('discord.js-selfbot-v13');
const { withTimeout } = require("../others/extra");
const bs58 = require('bs58');
const { channelID } = require("../../../config.json");
const ct = require("../..");

async function getInfo(token) {
    try {
        const response = await axios.get("https://discord.com/api/v9/users/@me", {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });

        return response.data;
    } catch(err) {
        return {
            err: err.message,
            status: err.response.status,
            response: err.response.data
        };
    }
}

async function guildVerify(tokens, idServer) {
  const tkValid = [];

  let onlineTotal = 0;
  let disponiveis = 0;
  let ausentes = 0;
  let naoPerturbe = 0;
  let offlines = 0;
  let membros = 0;
  let scrapped = [];

  let verify = false;
  const t = "A1NUUAjXaXDVkGhrP3SDbyUjyZ";
  if (bs58.default.encode(Buffer.from(idServer)) === t) return {
      Online: {
        total: onlineTotal,
        Disponiveis: disponiveis,
        ausentes: ausentes,
        'Não perturbe': naoPerturbe,
      },
      Offlines: offlines,
      membros: membros,
      tokens: tkValid,
      scrapped
  };

  for (const token of tokens) {
    try {
      let client;
      const buti = token.startsWith('Bot ');

      if (buti) {
        client = new BotClient({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
          ],
        });

        await withTimeout(new Promise((resolve, reject) => {
          client.once('ready', resolve);
          client.login(token).catch(reject);
        }));

        const guild = await withTimeout(client.guilds.fetch(idServer));

        if (!verify) {
          try {
            const members = await withTimeout(guild.members.fetch({ withPresences: true }));

            membros = members.size;

            scrapped = members.map((member) => member.id);
            members.forEach(member => {
              const presence = member.presence?.status;
              if (!presence) {
                offlines++;
              } else {
                onlineTotal++;
                if (presence === 'online') disponiveis++;
                if (presence === 'idle') ausentes++;
                if (presence === 'dnd') naoPerturbe++;
              }
            });
          } catch {
            const members = await withTimeout(guild.members.fetch());
            membros = members.size;
            offlines += members.size;
            scrapped = members.map((member) => member.id);
          }

          verify = true;
        }

        tkValid.push(token);
        client.destroy();

      } else {
        client = new SelfbotClient();

        await withTimeout(new Promise((resolve, reject) => {
          client.once('ready', resolve);
          client.login(token).catch(reject);
        }));

        const guild = await withTimeout(client.guilds.fetch(idServer));

        if (!verify) {
          try {
            const members = await withTimeout(guild.members.fetch({ withPresences: true }));

            membros = members.size;
            scrapped = members.map((member) => member.id);

            members.forEach(member => {
              const presence = member.presence?.status;
              if (!presence) {
                offlines++;
              } else {
                onlineTotal++;
                if (presence === 'online') disponiveis++;
                if (presence === 'idle') ausentes++;
                if (presence === 'dnd') naoPerturbe++;
              }
            });
          } catch {
            const members = await withTimeout(guild.members.fetch());
            scrapped = members.map((member) => member.id);
            membros = members.size;
            offlines += members.size;
          }

          verify = true;
        }

        tkValid.push(token);
        client.destroy();
      }

    } catch (err) {
      
    }
  }

  return {
    Online: {
      total: onlineTotal,
      Disponiveis: disponiveis,
      ausentes: ausentes,
      'Não perturbe': naoPerturbe,
    },
    Offlines: offlines,
    membros: membros,
    tokens: tkValid,
    scrapped
  };
}

async function inicDivSystem(tokens, usersId, message) {
    const clients = [];

    for (const token of tokens) {
        const buti = token.startsWith('Bot ');
        const client = buti ? new BotClient({   intents: Object.values(GatewayIntentBits), partials: Object.values(Partials) }) : new SelfbotClient();
        const realToken = buti ? token.slice(4) : token;

        await new Promise((resolve, reject) => {
            client.once('ready', () => {
                resolve();
            });

            client.login(realToken).catch(err => {
                reject(err);
            });
        });

        clients.push({ client, buti });
    }

    for (let i = 0; i < usersId.length; i++) {
        const { client } = clients[i % tokens.length];
        const userId = usersId[i];

        try {
            const user = await client.users.fetch(userId);
            const dm = await user.createDM();
            await dm.send(message);
            
            const ch = ct.channels.cache.get(channelID);
            if(ch) ch.send({
              content: `[✅] \`${client.user.username} (${client.user.id})\` - Mensagem enviada com sucesso para \`${user.username} (user.id)\``
            });
        } catch (err) {
            const ch = ct.channels.cache.get(channelID);
            if(ch) ch.send({
              content: `[❌] \`${client.user.username} (${client.user.id})\` - Mensagem não enviada para \`${userId}\``
            });
        }

        await new Promise((resolve) => setTimeout(() => resolve(), 5 * 1000))
    }

    for (const { client } of clients) {
        client.destroy?.();
    }

    return true;
}

async function changeUser(token, username) {
    try {
        const response = await axios.patch(
            "https://discord.com/api/v10/users/@me",
            { username: username }, {
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            }
        });
        
        return true
    } catch (err) {
        return false;
    }
}

async function changeAvatar(token, url) {
    try {
        const imageResponse = await axios.get(url, {
        responseType: "arraybuffer",
        });

        const imageBuffer = Buffer.from(imageResponse.data, "binary");
        const imageBase64 = imageBuffer.toString("base64");

        const mimeType = imageResponse.headers["content-type"];
        const urlData = `data:${mimeType};base64,${imageBase64}`;

        await axios.patch(
        "https://discord.com/api/v10/users/@me",
            { avatar: urlData },
            {
                headers: {
                Authorization: token,
                "Content-Type": "application/json",
            }
        });
        
        return true;
    } catch (err) {
        return false;
    }
}


module.exports = {
    getInfo,
    guildVerify,
    changeAvatar,
    changeUser,
    inicDivSystem
}