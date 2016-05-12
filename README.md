# cacilhas.github.io

Estrutura do projeto:

- `/css` Diretório contendo os arquivos CSS.
- `/fonts` Diretório contendo os arquivos de fonte.
- `/img` Diretório de imagens.
- `/misc` Diretório com arquivos para *download*.
- `/templates/kodumaro` Diretório com *templates* do Kodumaro, organizados em
  subdiretórios por ano e mês.
- `/templates/montegasppa` Diretório com *templates* do *blog* Reflexões de
  Monte Gasppa e Julia C. (ainda vazio).


### Criando uma entrada nova para o Kodumaro

Primeiro, caso não exista, deve ser criado uma árvore de diretórios dentro do
diretório `/templates/kodumaro`, sendo o primeiro subdiretório o ano, (`YYYY`),
e o interno o mês (`MM`).

Dentro desse diretório, é criado um arquivo HTML iniciado com o cabeçalho
(exemplo tirado de `/templates/kodumaro/2016/04/aspectos.html`):

```html
<script src="https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js"></script>
<script src="/js/kodumaro.js"></script>
<script language="javascript">
//<@[CDATA[
    document.title += ' :: Aspectos – parte I';
//]]></script>
```

Onde `Apectos – parte I` deve ser substituído pelo título do artigo.

A estrutura do documento é:

- Elemento pai é um `div` com classes `panel` e `panel-default`, dentro um `div`
  com classe `panel-heading` contendo o título em um `h2` com classe `mg-title`.

- O Corpo é um `div` com classe `panel-body` contendo parágrafos (`p`), sendo
  o primeiro com classe `mg-title`, os demais podem ser crus.

- Subtítulos em `h3`.

- Listas (`ul`) com classe `list-group` e itens (`li`) com classe
  `list-group-item`. Tenho colocado como primeiro elemento um `span` vazio com
  classes `glyphicon` e `glyphicon-hand-right`, para colocar uma mãozinha como
  *bullet*.

- Códigos em elementos `pre` com classe `prettyprint`, contendo elementos `code`
  com classe para a linguagem que deseja, por exemplo, Python é
  `language-python`.

- No final, fora do `div` pai, tenho criado outro `div` similar com um
  `panel-body` de alinhamento à direita e contendo um `small` para colocar um
  *link* para os *issues* do GitHub.

Qualquer dúvida, veja um
[arquivo pronto](https://github.com/cacilhas/cacilhas.github.io/blob/master/templates/kodumaro/2016/04/aspectos.html)
como exemplo.


### *Site map*

Finalmente, após criar um artigo, é preciso acrescentá-lo ao *site map*, que
está em `/js/site-map.js`.

É só adicionar um novo elemento na segunda posição contendo:

- `url`: a URL do artigo, seguindo o exemplo dos registros já existentes;
- `title`: o título do artigo;
- `content`: um resumo do conteúdo;
- `tags`: os *tags* – sendo do Kodumaro, cada *tag* deve sempre começar com
  `Kodumaro :: `, veja a lista de *tags* na [pǻgina](http://cacilhas.info/).
- `highlight`: *booleano* dizendo se o artigo deve aparecer em uma caixa na
  página inicial;
- `hidden`: *booleano* dizendo se o artigo deve ser escondido do mapa que na
  página inicial.
