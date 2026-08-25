require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");

const { initData, getData, saveData } = require("./db");

const app = express();
const MODEL = "claude-sonnet-4-6";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "troque-este-segredo-antes-de-usar",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // 8h
  })
);

initData();

// ---------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  return res.redirect("/login");
}

app.get("/", (req, res) => {
  res.redirect(req.session.loggedIn ? "/dashboard" : "/login");
});

app.get("/login", (req, res) => {
  if (req.session.loggedIn) return res.redirect("/dashboard");
  res.render("login", { erro: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const data = getData();

  const ok =
    username === data.admin.username &&
    (await bcrypt.compare(password, data.admin.passwordHash));

  if (!ok) return res.render("login", { erro: "Usuário ou senha inválidos." });

  req.session.loggedIn = true;
  res.redirect("/dashboard");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// ---------------------------------------------------------------------
// Painel e CRUD de contas
// ---------------------------------------------------------------------
app.get("/dashboard", requireAuth, (req, res) => {
  const data = getData();
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  res.render("dashboard", { contas: data.contas, baseUrl });
});

app.get("/contas/nova", requireAuth, (req, res) => {
  res.render("conta", { conta: null, erro: null });
});

app.post("/contas/nova", requireAuth, (req, res) => {
  const { nome, textoBase, link, contexto } = req.body;
  if (!nome || !textoBase) {
    return res.render("conta", {
      conta: req.body,
      erro: "Preencha ao menos o nome da conta e o texto base.",
    });
  }

  const data = getData();
  data.contas.push({
    id: crypto.randomUUID(),
    token: crypto.randomBytes(12).toString("hex"),
    nome,
    ativo: true,
    textoBase,
    link: link || "",
    contexto: contexto || "",
  });
  saveData(data);
  res.redirect("/dashboard");
});

app.get("/contas/:id/editar", requireAuth, (req, res) => {
  const data = getData();
  const conta = data.contas.find((c) => c.id === req.params.id);
  if (!conta) return res.redirect("/dashboard");
  res.render("conta", { conta, erro: null });
});

app.post("/contas/:id/editar", requireAuth, (req, res) => {
  const data = getData();
  const conta = data.contas.find((c) => c.id === req.params.id);
  if (conta) {
    conta.nome = req.body.nome;
    conta.textoBase = req.body.textoBase;
    conta.link = req.body.link || "";
    conta.contexto = req.body.contexto || "";
    conta.ativo = req.body.ativo === "on";
    saveData(data);
  }
  res.redirect("/dashboard");
});

app.post("/contas/:id/excluir", requireAuth, (req, res) => {
  const data = getData();
  data.contas = data.contas.filter((c) => c.id !== req.params.id);
  saveData(data);
  res.redirect("/dashboard");
});

app.post("/contas/:id/regerar-token", requireAuth, (req, res) => {
  const data = getData();
  const conta = data.contas.find((c) => c.id === req.params.id);
  if (conta) {
    conta.token = crypto.randomBytes(12).toString("hex");
    saveData(data);
  }
  res.redirect("/dashboard");
});

// ---------------------------------------------------------------------
// Alterar senha de acesso ao painel
// ---------------------------------------------------------------------
app.get("/config/senha", requireAuth, (req, res) => {
  res.render("senha", { erro: null, sucesso: null });
});

app.post("/config/senha", requireAuth, async (req, res) => {
  const { senhaAtual, novaSenha, confirmarSenha } = req.body;
  const data = getData();

  const ok = await bcrypt.compare(senhaAtual, data.admin.passwordHash);
  if (!ok) return res.render("senha", { erro: "Senha atual incorreta.", sucesso: null });

  if (!novaSenha || novaSenha.length < 6) {
    return res.render("senha", {
      erro: "A nova senha precisa ter ao menos 6 caracteres.",
      sucesso: null,
    });
  }
  if (novaSenha !== confirmarSenha) {
    return res.render("senha", { erro: "As senhas não conferem.", sucesso: null });
  }

  data.admin.passwordHash = await bcrypt.hash(novaSenha, 10);
  saveData(data);
  res.render("senha", { erro: null, sucesso: "Senha atualizada com sucesso." });
});

// ---------------------------------------------------------------------
// Endpoint público chamado pelo Manychat (um por conta, protegido por token)
// POST /gerar-dm/:contaId/:token
// Body esperado: { nome, comentario, post }
// ---------------------------------------------------------------------
app.post("/gerar-dm/:contaId/:token", async (req, res) => {
  try {
    const data = getData();
    const conta = data.contas.find((c) => c.id === req.params.contaId);

    if (!conta || conta.token !== req.params.token) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    if (!conta.ativo) {
      return res.status(403).json({ error: "Esta conta está desativada no painel." });
    }

    const { nome, comentario, post } = req.body;
    if (!comentario) {
      return res.status(400).json({ error: "Campo 'comentario' é obrigatório." });
    }

    const systemPrompt = `Você escreve mensagens curtas de Direct do Instagram para a marca/conta "${conta.nome}".

Texto/oferta base cadastrado para esta conta (use como referência do que comunicar, adapte ao comentário, não copie literalmente sempre):
"${conta.textoBase}"

Link a incluir quando fizer sentido: ${conta.link || "nenhum informado"}

Contexto adicional sobre o negócio (produtos, prazos, políticas etc.):
${conta.contexto || "nenhum informado"}

Regras:
- Máximo 3 frases.
- Tom caloroso e direto, nunca robótico ou genérico.
- Mencione algo específico do comentário da pessoa.
- Nunca invente promoções, preços ou prazos que não estejam no contexto acima.
- No máximo 1 a 2 emojis.`;

    const userPrompt = `Nome da pessoa: ${nome || "sem nome"}
Comentário: "${comentario}"
Post/Reel: ${post || "não informado"}

Escreva a mensagem de Direct para essa pessoa.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erro na API da Anthropic:", errText);
      return res.status(502).json({ error: "Falha ao gerar mensagem." });
    }

    const json = await response.json();
    const mensagem = json.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();

    res.json({ mensagem });
  } catch (err) {
    console.error("Erro no endpoint /gerar-dm:", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[dm-panel] Rodando na porta ${PORT}`));
