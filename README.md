# Colégio Técnico KNOW

Site institucional e interativo do Colégio Técnico KNOW, desenvolvido com HTML, CSS e JavaScript puro. O projeto apresenta a escola, seus cursos técnicos e um conjunto de ferramentas digitais para engajar futuros alunos: quiz vocacional, raspadinha promocional e formulário de pré-cadastro.

## Visão geral

O site foi criado para divulgar o Colégio Técnico KNOW e facilitar o primeiro contato de interessados com a instituição. A página reúne informações institucionais, cursos disponíveis, recursos interativos e um fluxo simples de captação de cadastros.

## Funcionalidades

- Página inicial com chamada para inscrições abertas, estatísticas e destaque dos cursos.
- Seção "Sobre" com história, missão, visão, valores e linha do tempo da instituição.
- Listagem dinâmica dos cursos a partir do arquivo `cursos.json`.
- Quiz vocacional com perguntas carregadas de `quiz.json` e resultado salvo no navegador.
- Raspadinha interativa em canvas, com limite de uma participação por dia usando `localStorage`.
- Formulário de pré-cadastro com validação de nome, idade, e-mail e curso de interesse.
- Painel administrativo simples para visualizar e limpar cadastros salvos localmente.
- Layout responsivo com estilos separados por módulo.

## Cursos disponíveis

- Técnico em Informática
- Técnico em Enfermagem
- Técnico em Administração

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Canvas API
- JSON
- LocalStorage
- Google Fonts

## Estrutura do projeto

```text
ProjetoKnowFinal/
├── index.html
├── script.js
├── cursos.json
├── quiz.json
├── premios.json
├── style.css
├── raspa.css
└── css/
    ├── style.css
    ├── quiz.css
    ├── formulario.css
    ├── matricula.css
    └── raspa.css
```

## Como executar

Como o projeto carrega dados de arquivos JSON com `fetch`, recomenda-se executar o site por um servidor local em vez de abrir o `index.html` diretamente no navegador.

### Opção com Python

Na pasta do projeto, execute:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

### Opção com VS Code

Também é possível usar a extensão Live Server:

1. Abra a pasta `ProjetoKnowFinal` no VS Code.
2. Clique com o botão direito em `index.html`.
3. Selecione `Open with Live Server`.

## Arquivos de dados

### `cursos.json`

Armazena as informações dos cursos exibidos na seção "Nossos Cursos" e no seletor do formulário de pré-cadastro.

### `quiz.json`

Contém as perguntas e alternativas usadas no quiz vocacional. Cada alternativa contribui para indicar um curso técnico compatível com o perfil do usuário.

### `premios.json`

Lista prêmios promocionais do projeto. A raspadinha atual também possui uma lista interna de prêmios no `script.js`.

## Armazenamento local

O projeto usa `localStorage` para guardar informações no navegador do usuário:

- Resultado do quiz vocacional.
- Cadastros enviados pelo formulário.
- Data da última participação na raspadinha.

Esses dados não são enviados para um servidor externo. Ao limpar os dados do navegador, as informações salvas também são removidas.

## Observações

- O formulário de pré-cadastro é apenas uma simulação local e não envia dados por e-mail ou banco de dados.
- A raspadinha possui chance de vitória definida no JavaScript.
- Para publicar o projeto online, basta hospedar todos os arquivos em um serviço de páginas estáticas, como GitHub Pages, Netlify ou Vercel.

## Autor

Projeto desenvolvido para o site do Colégio Técnico KNOW.
