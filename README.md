# VEX — Questionário de Entrevistas / GitHub Pages Demo

Esta é a versão estática para apresentação ao contratante via GitHub Pages.

## Importante

GitHub Pages não executa backend Node/Express nem SQLite. Por isso esta versão funciona como **demo navegável**:

- formulário multi-etapas funcional;
- dashboard anônimo funcional;
- respostas salvas no `localStorage` do navegador;
- exportação CSV agregada/anônima;
- sem exposição de nomes no dashboard.

A versão completa com backend e SQLite permanece em:

```txt
/root/vex-questionario-entrevistas
```

## Como visualizar localmente

```bash
cd /root/vex-questionario-entrevistas-pages
python3 -m http.server 8088
```

Acesse:

```txt
http://127.0.0.1:8088
```

## Como publicar no GitHub Pages

1. Crie um repositório vazio no GitHub, por exemplo:

```txt
vex-questionario-entrevistas
```

2. Autentique a GitHub CLI:

```bash
gh auth login
```

3. Depois rode:

```bash
cd /root/vex-questionario-entrevistas-pages
git remote add origin git@github.com:SEU_USUARIO/vex-questionario-entrevistas.git
git branch -M main
git push -u origin main
```

4. Ative GitHub Pages:

```bash
gh repo edit SEU_USUARIO/vex-questionario-entrevistas --enable-pages
```

Ou pelo painel do GitHub:

```txt
Settings → Pages → Deploy from branch → main → /root
```

## Arquivos principais

- `index.html` — questionário
- `admin.html` — dashboard anônimo
- `static-store.js` — armazenamento local, limpeza, tags e CSV
- `styles.css` — visual VEX
- `assets/vex-logo.svg` — logo oficial
