# Painel DM

Painel próprio, com login, para gerenciar automações de DM personalizada por
IA em **várias contas de Instagram ao mesmo tempo** — cada conta com seu
próprio texto, link e contexto, editáveis quando quiser, sem mexer em código.
Feito para trabalhar junto com o Manychat.

Só você acessa: o painel fica atrás de tela de login (usuário e senha),
sessão protegida por cookie, e cada conta tem uma URL de webhook própria e
secreta que só você vê no painel.

## O que ele faz (e o que não faz)

- ✅ Guarda o texto base, o link e o contexto de cada conta de Instagram
- ✅ Gera, sob demanda, uma DM personalizada com a API do Claude a partir
  desses dados + o comentário da pessoa
- ✅ Dá a você uma URL única por conta para colar no Manychat
- ❌ Não se conecta ao Instagram sozinho, não detecta comentários e não
  envia a DM — isso continua sendo função do Manychat (que já é autorizado
  pela API oficial da Meta). O painel só gera o *texto* da mensagem.

## 1. Instalar e rodar localmente (para testar)

```bash
npm install
cp .env.example .env
# edite o .env com seus dados
npm start
```

Acesse `http://localhost:3000`, faça login com o `ADMIN_USER`/`ADMIN_PASSWORD`
que você definiu no `.env`, e já troque a senha em "Alterar senha".

## 2. Deploy (para o Manychat conseguir chamar via internet)

Suba este projeto para um serviço como **Render** ou **Railway** (ambos têm
plano gratuito e fazem deploy direto de um repositório Git):

1. Suba esta pasta para um repositório no GitHub
2. Crie um novo "Web Service" no Render/Railway apontando para o repositório
3. Configure as variáveis de ambiente do `.env.example` no painel do host
   (nunca suba o `.env` com dados reais para o Git)
4. Depois do primeiro deploy, defina `BASE_URL` com a URL pública que o
   host te deu (ex: `https://dm-panel-xxxx.onrender.com`)

**Atenção sobre persistência:** os dados (contas, senha) ficam salvos em um
arquivo `data.json` dentro do próprio servidor. Em alguns planos gratuitos,
esse arquivo pode ser apagado a cada novo deploy. Se isso acontecer com
frequência no seu host, me avise que ajustamos para um banco de dados
externo (mais permanente).

## 3. Cadastrar suas contas de Instagram

1. Faça login no painel
2. Clique em "+ Nova conta"
3. Preencha:
   - **Nome da conta** — só para você identificar (ex: `@minhaloja`)
   - **Texto base** — o que a mensagem deve comunicar (a IA adapta ao
     comentário de cada pessoa, não repete igual sempre)
   - **Link** — o link que deve ser oferecido, se houver
   - **Contexto** — preços, prazos, políticas — tudo que a IA pode usar
     mas não pode inventar
4. Salve. O painel gera uma **URL de webhook única** para essa conta,
   mostrada no card dela.

## 4. Conectar cada conta no Manychat

Repita isso para cada uma das suas contas de Instagram (cada uma tem seu
próprio Manychat e sua própria URL de webhook):

1. No Manychat da conta correspondente, crie o fluxo de comentário
   (Automation > Comment Growth Tool), com a palavra-chave desejada
2. Adicione um bloco **Action > External Request**
3. Método: `POST`
4. URL: cole a URL de webhook mostrada no painel para *essa* conta
5. Body (JSON):
   ```json
   {
     "nome": "{{first_name}}",
     "comentario": "{{last_input_text}}",
     "post": "nome do post ou reel"
   }
   ```
6. Em "Test Request", teste e mapeie o campo de resposta usando o JSON
   Path `$.mensagem` para um Custom User Field (ex: `dm_personalizada`)
7. Logo depois, adicione um bloco de texto normal com `{{dm_personalizada}}`
   — essa é a DM que a pessoa recebe

## 5. Editar depois

Sempre que quiser mudar o texto, o link, pausar uma conta ou trocar a senha
do painel, é só entrar e editar — não precisa mexer em código nem redeployar
nada.

## 6. Segurança

- O painel inteiro fica atrás de login
- Cada conta tem uma URL de webhook com um token aleatório embutido —
  só quem tem essa URL exata consegue chamá-la
- Se desconfiar que uma URL vazou, use "Gerar novo link" no card da conta
  (o link antigo para de funcionar na hora — lembre de atualizar no
  Manychat depois)
