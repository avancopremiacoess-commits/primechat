const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "data.json");

// Cria o arquivo de dados e o usuário admin na primeira execução,
// usando as credenciais definidas nas variáveis de ambiente.
function initData() {
  if (fs.existsSync(DB_PATH)) return;

  const username = process.env.ADMIN_USER || "admin";
  const plainPassword = process.env.ADMIN_PASSWORD || "troque-esta-senha";
  const passwordHash = bcrypt.hashSync(plainPassword, 10);

  const data = {
    admin: { username, passwordHash },
    contas: [],
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  console.log(
    `[dm-panel] Usuário admin criado: "${username}". Faça login com a senha definida em ADMIN_PASSWORD e troque-a depois em "Alterar senha".`
  );
}

function getData() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { initData, getData, saveData };
