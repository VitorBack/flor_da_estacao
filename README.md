# Flor da Estação

Sistema de balcão de uma floricultura, desenvolvido com **HTML, CSS e JavaScript puro**, sem frameworks, dependências, backend ou banco de dados real.

## Executar

Abra `index.html` diretamente no navegador. Todas as imagens estão incluídas no projeto; o sistema funciona sem internet.

Para usar um endereço local estável, com Node.js 18 ou superior instalado:

```sh
npm start
```

Acesse **http://localhost:5173**. Não é necessário executar `npm install`. O pequeno servidor incluído apenas entrega os arquivos estáticos; toda a lógica e persistência estão no navegador. Para encerrar, pressione `Ctrl+C` no terminal.

## Funcionalidades

- **Catálogo:** 12 produtos de exemplo em seis categorias, busca sem distinção de acentos, filtro de disponibilidade e imagens locais. Os cartões são renderizados a partir dos dados em JavaScript.
- **Pedido atual:** adicionar, aumentar, diminuir, remover, limpar, informar o cliente opcionalmente e acompanhar o total em reais. O carrinho é recuperado ao recarregar a página.
- **Finalização:** registra o pedido e baixa os saldos dos lotes, priorizando os que vencem primeiro. A quantidade é validada novamente no fechamento. Nenhum pagamento é solicitado.
- **Estoque:** lista quantidade disponível, lotes e validade; destaca baixo estoque, vencimento próximo e produtos vencidos. Permite registrar novos lotes e ajustar o saldo ou a validade de um lote existente.
- **Histórico:** consulta de pedidos com cliente, data, quantidades, valores unitários e total preservados no momento da venda.
- **Exportação JSON:** baixa uma cópia completa dos produtos, lotes, carrinho e pedidos pela aba Estoque.
- **Responsividade e acessibilidade:** versões para computador, tablet e celular; navegação por teclado, rótulos dos controles, diálogos e mensagens de estado. A tecla `/` leva à busca da aba atual.

## Dados mockados e persistência

`data/database.json` é a fonte dos dados iniciais. Os preços estão em **centavos inteiros** para evitar erros de arredondamento. Cada produto possui seus próprios lotes.

No primeiro uso, `expiresInDays` é convertido em uma data de validade real relativa ao dia em que a demonstração é aberta. Após isso, a data fica salva e envelhece normalmente. Os exemplos incluem um produto esgotado, lotes próximos da validade e um lote vencido para demonstrar os filtros e bloqueios.

Os dados atualizados são serializados em JSON no `localStorage`, na chave `flor-da-estacao:v1`. Os dados pertencem a este navegador e a este endereço; não são compartilhados entre dispositivos. Limpar os dados do site apaga essa persistência. Use **Exportar JSON** para guardar uma cópia. Se o navegador bloquear o armazenamento, a aplicação avisa e mantém as alterações em memória durante a sessão.

O navegador não pode sobrescrever silenciosamente o arquivo JSON do projeto. Por isso, a finalização atualiza a cópia JSON do navegador, e a exportação entrega o arquivo atualizado para download.

`data/seed.js` é uma cópia gerada do JSON para permitir abrir `index.html` inclusive por `file://`, sem requisições `fetch`. Depois de editar `data/database.json`, execute:

```sh
npm run sync
```

`npm start` também faz essa sincronização. Dados já salvos no navegador têm prioridade sobre os exemplos. Para reiniciar uma demonstração, exporte os dados que deseja guardar e remova a chave `flor-da-estacao:v1` no armazenamento do site pelas ferramentas de desenvolvimento do navegador.

## Regras de estoque

- Lotes perecíveis exigem validade. Produtos não perecíveis podem ter validade opcional.
- A validade inclui todo o dia informado, seguindo a data local do navegador.
- Lotes vencidos permanecem no controle de estoque, mas não podem ser vendidos.
- Adicionar ao carrinho não baixa o estoque. A baixa ocorre apenas na finalização.
- A baixa segue a menor validade primeiro (FEFO); lotes sem validade ficam por último.
- Uma falha de validação não altera parcialmente o estoque nem registra o pedido.
- O ajuste de um lote informa seu **novo saldo total**, e não uma quantidade a acrescentar.
- Se o ajuste reduzir o disponível abaixo do carrinho, o carrinho é reduzido para o saldo disponível.

## Verificação

```sh
npm test
npm run check
```

Os testes usam o executor nativo do Node.js e verificam totais, limites de estoque, validade, prioridade dos lotes, fechamento atômico, ajustes e serialização JSON. Não há instalação de pacotes.

## Estrutura

```text
index.html            Estrutura semântica da interface
styles.css            Identidade visual e layout responsivo
js/app.js             Renderização do DOM, eventos e armazenamento local
js/core.js            Regras de carrinho, lotes, estoque e pedidos
data/database.json    Banco de dados de exemplo
data/seed.js          Versão gerada do JSON para execução sem servidor
assets/               Imagens e ilustrações locais
scripts/              Servidor estático e sincronizador de dados
tests/                Testes das regras de negócio
```

## Imagens

Fotos de demonstração de [Unsplash](https://unsplash.com) e [Pexels](https://www.pexels.com). As imagens são ilustrativas. As ilustrações vetoriais dos presentes, do vaso e da identidade foram criadas para o projeto.

Fontes dos arquivos locais: imagens Unsplash `1563241527-3004b7be0ffd` (banner), `1561181286-d3fee7d55364` (buquê), `1520763185298-1b434c919102` (tulipa), `1457089328109-e5d9bd499191` (arranjo), `1468327768560-75b778cbb551` (flores), `1487070183336-b863922373d4` (floricultura), `1485955900006-10f4d324d411` (planta em vaso), `1497250681960-ef046c08a56e` (folhagem); Pexels `931177` (rosas).
