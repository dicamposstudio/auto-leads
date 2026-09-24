# DiCampos Auto Leads — MVP FIPE

Protótipo para lojas de veículos: consulta FIPE + formulário de qualificação + mensagem estruturada para WhatsApp.

## O que já funciona

- Carros, motos e caminhões.
- Marca → modelo → ano/combustível.
- Consulta de valor FIPE por API.
- Proxy server-side em Cloudflare Pages Functions (a API não fica acoplada ao navegador).
- Tela de resultado com preço, código FIPE e mês de referência.
- Formulário de qualificação.
- Mensagem pronta para WhatsApp.
- Layout responsivo para apresentação no celular.

## Estrutura

```text
/
├─ index.html
├─ styles.css
├─ app.js
└─ functions/
   └─ api/
      └─ fipe/
         └─ [[path]].js
```

## Importante antes de publicar

Abra `app.js` e altere:

```js
const DEALER_WHATSAPP = '5581999999999';
```

Use DDI + DDD + telefone, apenas números.

## Como publicar no Cloudflare Pages

1. Crie um repositório GitHub com estes arquivos.
2. No Cloudflare Dashboard, abra **Workers & Pages → Create → Pages → Connect to Git**.
3. Escolha o repositório.
4. Framework preset: **None**.
5. Build command: deixe vazio.
6. Build output directory: `/`.
7. Faça o deploy.

A pasta `functions/` será reconhecida pelo Cloudflare Pages e criará as rotas `/api/fipe/*`.

## Token FIPE (opcional, recomendado para testes com mais margem)

A API aceita uso sem token, mas possui limite diário. Para usar um token, adicione no Cloudflare Pages:

**Settings → Variables and Secrets → Add**

Nome:

```text
FIPE_TOKEN
```

Valor: seu token da FIPE API.

O navegador nunca recebe esse token; ele é aplicado apenas pela Function.

## Próxima etapa recomendada

1. Salvar leads em Google Sheets / CRM.
2. Eventos GA4/GTM: `fipe_started`, `fipe_result`, `lead_started`, `whatsapp_click`.
3. Configuração white-label por loja (logo, cores, WhatsApp e nome).
4. Página de agradecimento e UTM/origem do lead.
5. Rate limiting por IP e cache adicional antes do uso comercial em escala.

## Fonte dos dados

FIPE API / Parallelum — documentação: https://fipe.api.br/docs/api
