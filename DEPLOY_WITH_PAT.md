# Gerar e usar um Personal Access Token (PAT) para fazer push

⚠️ AVISO DE SEGURANÇA (LEIA ANTES)

- Este documento contém instruções para gerar e usar um Personal Access Token (PAT). NÃO compartilhe o token real em commits, issues, PRs ou qualquer lugar público. O token é sensível e oferece acesso ao(s) seu(s) repositório(s).
- Prefira tokens fine-grained com escopos mínimos, use expiração curta e, para automações, prefira GitHub Actions + Secrets ou GitHub Apps com permissões restritas.
- Para autenticação local, considere usar o GitHub CLI (`gh auth login`) ou o helper de credenciais do Git para evitar colar o token manualmente.

Estas instruções mostram como gerar um Personal Access Token (PAT) e usá‑lo para enviar (push) commits para o GitHub a partir do terminal.

1. Gerar o Personal Access Token (PAT)
   - Acesse https://github.com/settings/tokens (com sua conta logada).
   - Clique em "Generate new token" > "Generate new token (classic)".
   - Dê um nome ao token, por exemplo `dm-panel-deploy`.
   - Em "Expiration", escolha 90 dias (ou "No expiration" se preferir não renovar, embora seja menos seguro).
   - Marque a caixa `repo` (dá acesso completo aos repositórios) — ajuste scopes conforme a necessidade mínima.
   - Role até o final e clique em "Generate token".

2. Copiar o token exibido
   - O GitHub mostrará o token UMA única vez (algo como `ghp_a1B2c3D4e5F6g7H8i9J0k...`).
   - Copie e cole em um local seguro temporariamente (ex.: bloco de notas) — se fechar a página sem copiar, será necessário gerar outro.

3. Rodar os comandos no terminal (dentro da pasta do projeto)
   - Configure seu repositório remoto (se ainda não):
     ```bash
     git remote add origin https://github.com/<seu-usuario>/<seu-repo>.git
     ```
   - Faça o push para o branch principal:
     ```bash
     git push -u origin main
     ```

4. O que o GitHub vai pedir no push
   - Ao rodar `git push -u origin main`, o terminal pode pedir:
     - `Username for 'https://github.com':` — digite seu usuário do GitHub e aperte Enter.
     - `Password for 'https://<usuario>@github.com':` — aqui você NÃO digita sua senha normal; cole o TOKEN que copiou no passo 2 e aperte Enter.

5. Confirmação de sucesso
   - Se tudo deu certo, o terminal mostrará algo como:
     ```
     Enumerating objects: ...
     Writing objects: 100%...
     To https://github.com/<seu-usuario>/<seu-repo>.git
      * [new branch]      main -> main
     ```
   - Isso confirma que os arquivos foram enviados ao GitHub. Você pode confirmar atualizando a página do repositório no navegador.

---

Avisos e boas práticas de segurança
- Tokens são sensíveis: nunca publique o PAT em commits, issues, PRs, arquivos do repositório ou canais públicos.
- Prefira tokens fine‑grained (com escopo mínimo) quando possível, e escolha uma expiração curta.
- Para automações e deploys, prefira usar GitHub Actions + Secrets ou um GitHub App com permissões restritas.
- Alternativa mais segura para autenticar localmente: use o GitHub CLI (`gh auth login`) ou o helper de credenciais do Git (credential helper) para evitar colar o token manualmente.

---

English — Generate and use a Personal Access Token (PAT) to push

⚠️ SECURITY NOTICE (READ FIRST)

- This document explains how to generate and use a Personal Access Token (PAT). DO NOT share the actual token in commits, issues, pull requests, or any public channel. The token grants access to your repositories.
- Prefer fine-grained tokens with minimal scopes, set a short expiration, and for CI/CD use GitHub Actions secrets or a GitHub App instead.
- For local authentication, consider `gh auth login` (GitHub CLI) or a credential helper to avoid pasting tokens into the terminal.

Steps

1. Generate the PAT
   - Visit https://github.com/settings/tokens while signed in.
   - Click "Generate new token" > "Generate new token (classic)".
   - Give the token a name like `dm-panel-deploy`.
   - Select an expiration (e.g., 90 days).
   - Check the `repo` scope (or select the minimal scopes you actually need).
   - Click "Generate token".

2. Copy the token
   - GitHub will show the token ONCE. Copy it to a secure temporary place (e.g., a password manager). If you lose it, generate a new one.

3. Push from the terminal (inside your project folder)
   - Ensure the remote is set:
     ```bash
     git remote add origin https://github.com/<your-username>/<your-repo>.git
     ```
   - Push:
     ```bash
     git push -u origin main
     ```

4. When prompted by git
   - `Username for 'https://github.com':` — enter your GitHub username.
   - `Password for 'https://<user>@github.com':` — paste the PAT (not your account password) and press Enter.

5. Verify
   - If successful, git will show the push progress and the new branch on GitHub. Refresh the repository page to confirm.

