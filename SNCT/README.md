# ROMAN: Guardiã das Estrelas

Jogo arcade educativo criado para a SNCT. Este documento registra as mudanças feitas no projeto durante este chat e explica onde encontrar seus arquivos. O histórico será atualizado a cada nova instrução que resulte em alterações no projeto.

## Como abrir o jogo

No VS Code, abra a pasta `SNCT` e inicie a configuração **Open index.html** em **Executar e Depurar**. Ela abre `html/index.html` no navegador integrado.

O jogo também pode ser aberto diretamente por `html/index.html`. O HTML busca o CSS em `../css/style.css` e o JavaScript em `../js/game.js`.

## Histórico de alterações

### 1. Separação dos arquivos do jogo

O projeto começou como uma página HTML única. O conteúdo foi separado em:

- `html/index.html`: estrutura da página e elemento canvas do jogo.
- `css/style.css`: estilos da página e do canvas.
- `js/game.js`: lógica, controles, áudio, desenho e animação do jogo.

### 2. Correção da abertura pelo VS Code

O navegador integrado mostrava uma tela em branco porque `.vscode/launch.json` apontava para `html/game.js`, como se o JavaScript fosse uma página HTML. A configuração foi corrigida para abrir `html/index.html`, e os caminhos relativos para CSS e JavaScript foram ajustados.

### 3. Movimento e animações desenhadas no jogo

Foi adicionada uma inclinação suave à nave quando ela sobe ou desce. Também foram experimentados efeitos desenhados diretamente no canvas para o motor, os projéteis e o sol de fundo.

### 4. Primeira folha de sprites

Uma folha de sprites fornecida pelo usuário foi copiada para `assets/sprites/source-sheet.jpg`. O fundo verde foi removido e os elementos foram recortados em arquivos PNG:

- `ship-1.png` a `ship-5.png`: quadros da nave original.
- `shot-single.png`: disparo simples.
- Os quadros do sol e o sprite de disparo múltiplo foram usados temporariamente e depois removidos a pedido do usuário.

### 5. Ajustes no sol e nos disparos

O sol com rosto foi retirado. O sol de fundo voltou ao desenho circular original e depois recebeu uma aparência mais trabalhada, feita no próprio código: halo, raios de corona e detalhes na superfície.

O tiro múltiplo foi restaurado para três direções. Ele usa o sprite do disparo simples com tonalidade azul; o disparo preciso continua usando a versão dourada.

### 6. Otimizações de renderização

Para reduzir trabalho repetido durante o jogo:

- As versões dourada e azul dos projéteis, incluindo o brilho, são preparadas quando o sprite carrega e reutilizadas durante a partida.
- O fundo, a superfície do sol e a granulação da tela são armazenados em canvas auxiliares, em vez de serem reconstruídos a cada quadro.
- A inicialização do áudio foi removida do ciclo de atualização que roda em todos os quadros.

Naquele ponto do histórico, ainda não havia limitador de FPS nem opções gráficas; ambos foram adicionados na versão 3.0, descrita abaixo.

### 7. Nave própria para o P2

Uma segunda folha de sprites foi fornecida pelo usuário e preservada em `assets/sprites/p2-sheet.jpg`. Seus quatro quadros da nave com motor foram recortados, tiveram o fundo removido e foram salvos como `ship-p2-1.png` a `ship-p2-4.png`.

O segundo jogador usa essa nave turquesa animada tanto no co-op quanto no versus. A nave do P1 continua usando `ship-1.png` a `ship-5.png`.

### 8. Versão 3.0: menus, pausa e configurações

O fluxo de entrada foi reorganizado em três telas: abertura com o título e a instrução para iniciar, menu principal com Jogar/Codex/Configurações/Sair e seleção de modo (Solo, Co-op ou Versus). Os botões podem ser usados com mouse, toque ou teclado/controle.

Na revisão visual, os menus passaram a usar a identidade espacial do jogo, com a Aberração, cores de nebulosa e painéis translúcidos. A referência do Minecraft ficou restrita à navegação simples por opções; os botões deixaram de usar o estilo de blocos. O layout e o canvas agora se ajustam ao espaço disponível da janela.

Durante a partida, `Esc` abre e fecha a pausa. Ela mostra o título, as vidas de cada jogador e uma nova carta estelar a cada pausa. O menu permite retomar, reiniciar a missão, abrir as configurações ou voltar ao menu principal. Reiniciar começa novamente pelo primeiro boss, restaura cada jogador para 5 vidas e reinicia o progresso da campanha.

As configurações incluem volume de 0 a 100, qualidade gráfica Alta/Econômica e limite de 30, 60, 120, 144, 165 FPS ou sem limite. O limite escolhido depende do que o navegador e a tela conseguem apresentar; selecionar 165 FPS não aumenta a taxa física de atualização de um monitor mais lento. A qualidade Econômica reduz alguns detalhes visuais e partículas.

#### Acesso secreto (somente documentação)

Com a partida pausada, pressione `H` para abrir o painel secreto. Ele não abre durante a partida ativa nem nos menus. Nele é possível ativar God Mode (vida infinita e dano muito alto), vida infinita separadamente e multiplicadores de dano de 1x, 2x, 4x, 8x ou 16x. Essas opções permanecem ao reiniciar a mesma fase e voltam ao padrão quando uma nova partida/fase é iniciada.

## Estrutura atual

```text
SNCT/
├── .vscode/
│   └── launch.json
├── assets/
│   ├── sprites/
│   │   ├── p2-sheet.jpg       # Folha original do P2
│   │   ├── ship-p2-1.png      # Quadros da nave do P2
│   │   ├── ship-p2-2.png
│   │   ├── ship-p2-3.png
│   │   ├── ship-p2-4.png
│   │   ├── source-sheet.jpg   # Folha original da nave e do tiro
│   │   ├── ship-1.png         # Quadros da nave do P1
│   │   ├── ship-2.png
│   │   ├── ship-3.png
│   │   ├── ship-4.png
│   │   ├── ship-5.png
│   │   └── shot-single.png
│   └── rewards/
│       ├── ag-carinae-color.png
│       ├── ag-carinae-red.png
│       └── pillars-of-creation.png
├── css/
│   └── style.css
├── html/
│   └── index.html
├── js/
│   └── game.js
└── README.md
```

### 9. Versão 4.0: campanha, bosses e Foco Final

A campanha passou a ter três bosses, com menos vida que o boss antigo, ajuste de ritmo, quatro vidas iniciais e recuperação de vida entre encontros. A contagem de tempo é mantida durante a campanha. A primeira implementação colocou o minigame **Foco Final** em uma tela própria e organizou os bosses como Aberração, Guardião dos Pilares e Espectro Carmesim; a revisão da seção 10 substitui esse fluxo e a ordem final dos encontros.

As três imagens anexadas foram identificadas com páginas oficiais da NASA/Hubble. A imagem dos Pilares da Criação é M16; as outras duas são **composições diferentes da mesma estrela, AG Carinae**: uma mostra a casca em vermelho e a outra combina dados de vários filtros em cores. Elas permanecem associadas ao mesmo objeto nas recompensas, sem serem apresentadas como dois objetos distintos.

Os arquivos da pasta `assets/rewards` são as cópias anexadas pelo usuário. As páginas oficiais e créditos das imagens são:

- **Pilares da Criação, M16** — NASA, ESA e Hubble Heritage Team (STScI/AURA). [Página oficial e descrição](https://science.nasa.gov/asset/hubble/2014-hubble-wfc3uvis-image-of-m16-cropped/).
- **AG Carinae, casca avermelhada** — NASA, ESA e STScI. [Página oficial e descrição](https://science.nasa.gov/image-detail/ag-carinae-2/).
- **AG Carinae, composição colorida** — NASA, ESA e STScI. A composição atribui cores a exposições de vários filtros do Hubble. [Página oficial e informação sobre as cores](https://science.nasa.gov/asset/hubble/ag-carinae/).

Para este projeto educativo, as imagens são apresentadas com seus créditos e contexto, sem logotipos ou alegação de endosso da NASA. As diretrizes da agência dizem que seu conteúdo é geralmente reutilizável para fins educativos e informativos, mas material de terceiros pode ter restrições próprias; verifique a página de origem antes de redistribuir as imagens fora desse contexto. [Diretrizes de uso de imagens e mídia da NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/).

### 10. Refinamento do pedido da versão 4.0: chefes, captura integrada e referências

A Aberração foi redesenhada no próprio canvas como uma entidade espectral brilhante, com corpo translúcido, olhos luminosos e rastros de energia, aproximando a silhueta da referência enviada sem reutilizar personagens ou arte de outro jogo. O segundo boss é o Espectro Carmesim, e **os Pilares da Criação agora são o terceiro e último boss** da campanha.

A imagem local dos Pilares da Criação também aparece no menu principal, identificada como boss final. As outras duas recompensas continuam sendo imagens de AG Carinae, então a campanha agora mostra os Pilares no menu e reserva a fotografia correspondente para a vitória final.

O Foco Final deixou de trocar a cena do jogo. Quando a vida do boss acaba, a arena continua visível e a captura aparece como uma sobreposição compacta no HUD. O jogador acompanha uma estrela-alvo dentro de uma faixa vertical verde. A faixa sofre gravidade e cada toque em **Espaço** dá um impulso para cima; a captura avança enquanto a estrela permanece dentro dela. O progresso e o tempo aparecem ao lado, e o setor de luz parte da frente da nave em direção ao boss, aumentando de brilho e largura conforme a captura se aproxima do fim. Se o tempo de 18 segundos acabar, o foco é concluído automaticamente para não bloquear a campanha.

Ao completar a captura, um breve clarão e um som sintético de obturador marcam a foto. A imagem, o nome do objeto, o contexto científico e os créditos aparecem em um cartão sobre a arena; Enter avança antes do limite automático de leitura. No controle por toque, um toque na tela também impulsiona a faixa.

A faixa móvel e a meta de manter o alvo dentro dela foram adaptadas da mecânica de pesca descrita na [wiki de Stardew Valley](https://stardewvalleywiki.com/Fishing). A implementação usa arte própria do jogo e substitui o controle contínuo por impulsos curtos de Espaço, com gravidade, para combinar com o pedido e com o tema do satélite.

As fontes oficiais e créditos das três imagens permanecem registrados na seção anterior. A imagem dos Pilares é exibida tanto no menu quanto na recompensa final; as duas composições de AG Carinae aparecem nas recompensas dos dois primeiros bosses.

As descrições da Aberração e do impulso breve em Espaço acima registram a etapa anterior do desenvolvimento. As substituições atuais estão logo abaixo.

### 11. Revisão dos bosses e do controle de Foco Final

A pedido do usuário, a Aberração foi removida da campanha e da arte dos menus. O primeiro boss agora representa AG Carinae em sua casca avermelhada; a imagem correspondente compõe seu núcleo, cercada por nuvens de gás vermelhas desenhadas no jogo. O antigo Espectro Carmesim também foi redesenhado para se aproximar da composição colorida de AG Carinae, com a imagem correspondente como núcleo e nebulosa azul e vermelha ao redor da estrela; seu nome no jogo agora é **AG CARINAE · NEBULOSA COLORIDA**. Os Pilares da Criação seguem como boss final.

O controle da faixa foi alterado para aceleração contínua, conforme o funcionamento da pesca de Stardew Valley: segurar Espaço acelera a faixa para cima; soltar deixa a gravidade acelerá-la para baixo. A faixa conserva o impulso e demora um pouco para inverter a direção. Ao tocar o limite inferior, ela rebate. O jogador mantém o alvo dentro da faixa verde enquanto o medidor de captura enche. [Referência das regras da faixa e do medidor](https://wiki.stardewvalley.net/Fishing).

## Próximas etapas previstas

O usuário planeja aprofundar co-op e versus, facilitar o uso de controles e fazer uma etapa final de polimento.

### 12. Polimento visual e revisão da pausa

O boss continua sendo desenhado nas cenas de introdução, preparação, combate e pausa, junto com os objetos da arena. A imagem de recompensa dos Pilares da Criação foi removida da abertura e do menu principal; esses espaços agora usam apenas um emblema astronômico abstrato, sem antecipar a arte do boss final.

O menu de pausa ganhou uma faixa própria para o título, painel reposicionado e colunas separadas para as ações, vidas e cartas estelares. A camada de escurecimento e o painel ficaram mais translúcidos para preservar a leitura da arena e do boss ao fundo. As quatro ações existentes — retomar, reiniciar fase, configurações e menu principal — permanecem disponíveis.

A seleção dos botões agora recebe uma pulsação suave de brilho e contorno, sem aumentar sua área ou cobrir opções vizinhas. Navegar e clicar também dá uma resposta sonora curta, respeitando o volume configurado. Impactos e eventos de combate continuam usando os efeitos já existentes. O canvas mantém a escala responsiva do projeto.

Para conferir, abra `html/index.html` diretamente ou use a configuração **Open index.html** no VS Code. Inicie uma campanha, avance até uma arena e pressione `Esc` para pausar; a arena escurecida e o boss devem continuar visíveis atrás do menu.

### 13. Estilização consistente dos menus

Esta etapa refinou somente a apresentação visual das telas de menu. O título da pausa agora ocupa uma área acima do painel, com separação clara do estado “Pausado”. Painéis receberam contorno interno e detalhes espaciais discretos; as informações do Codex e os grupos de limite de FPS ganharam divisões visuais; a pausa mantém colunas distintas para ações e informações.

O destaque de foco também diferencia teclado e ponteiro sem ampliar os botões: o teclado usa contorno interno tracejado e o ponteiro usa uma faixa luminosa lateral com realce superior. O brilho selecionado continua lento e suave. A abertura e o menu principal permanecem sem imagens do boss final. Mecânicas, textos, controles, navegação e opções dos menus foram preservados.

Para conferir, abra `html/index.html` ou use **Open index.html** no VS Code. Visite o menu principal, seleção de modo e dificuldade, configurações e Codex; durante uma partida, pressione `Esc` para revisar a composição da pausa.

### 14. Alinhamento do telescópio e vida dos bosses no co-op

Durante o Foco Final, cada telescópio agora gira para acompanhar o rumo do próprio feixe de captura até o boss. Fora dessa etapa, sua orientação continua respondendo à inclinação vertical do movimento como antes.

No co-op, a vida dos bosses recebe um multiplicador de **1,8×** para compensar os dois jogadores atacando juntos. A vida no solo e no modo Versus permanece inalterada; a escala de dificuldade existente continua sendo aplicada normalmente.

### 15. Compatibilidade com controles

Foi adicionado suporte pela Gamepad API para dois controles simultâneos. O perfil padrão mantém **RT** para disparo, **B** para super, analógico esquerdo e direcional para movimento, **X** para alternar o telescópio, **A** para confirmar, **Start** para pausar/retomar e **View/Back** para voltar. Os nomes de botões na tela se adaptam ao padrão Xbox, PlayStation ou Nintendo quando o navegador informa o tipo do controle.

Em **Configurações → Controle**, escolha Player 1 ou Player 2 e selecione uma ação para remapeá-la: direções do direcional, disparo, super, troca do telescópio, confirmar, pausar e voltar. A movimentação pelo analógico esquerdo continua disponível. Os mapeamentos são salvos localmente no navegador; o botão **Padrões** restaura o perfil de fábrica do jogador selecionado. Durante a remapagem, pressione o botão desejado no controle selecionado; `Esc` cancela. As instruções in-game alternam conforme o último dispositivo usado — teclado, controle ou toque — inclusive no avanço após a captura de cada boss.

No menu de pausa, as quatro opções agora formam uma grade 2×2: esquerda/direita troca de coluna e cima/baixo troca de linha. Nas outras telas, o foco acompanha a posição das opções e permite navegar horizontalmente pelas grades e verticalmente entre as linhas. O menu principal mantém sua navegação vertical original. Conecte os controles antes ou durante a partida; o jogo exibe o estado detectado na aba de controle.

### 16. Revisão final do espaçamento visual dos menus

Na revisão de estilização, o título de Configurações foi reposicionado para ficar claramente dentro do painel, sem tocar no contorno superior. O título da pausa já estava separado do painel e das opções e foi mantido nessa composição.

A imagem enviada mostrava um segundo problema de espaçamento no painel Foco Final: o percentual da captura ficava encostado na instrução de controle. A área inferior foi reorganizada com um separador e mais respiro entre percentual, instruções e cronômetro; o tamanho da instrução se ajusta ao texto do dispositivo ativo. Essa mudança é apenas visual e não altera a física, a entrada ou o progresso do minigame.

### 17. Reinício completo da missão pela pausa

A ação **Reiniciar fase** do menu de pausa agora reinicia a campanha desde o início. O caminho do botão (`pause:restart`) chama `restartStage()`, que recria a partida no modo e dificuldade atuais, coloca cada jogador em 5 vidas e retorna à introdução do primeiro boss. O reinício também limpa o progresso da rodada, as cartas coletadas e os cheats temporários, como em uma nova missão. Pressione a tecla ou botão de confirmação para sair da introdução e começar a luta.

### 18. Três trilhas de música

A música sintetizada anterior foi removida. Os efeitos sonoros continuam usando Web Audio e a configuração atual de volume controla tanto os efeitos quanto as faixas.

Coloque os arquivos em assets/audio/ com estes nomes:

- menu.mp3: música de menu, desde Música de menu.mpeg (o arquivo é áudio MPEG Layer III/MP3; foi copiado sem recodificação e recebeu a extensão adequada).
- normal.mp3: música das partidas na dificuldade Normal, desde Musica modo Normal.mp3.
- especialista.m4a: música das partidas na dificuldade Especialista, desde Música modo Especialista.mp4 (o arquivo é áudio AAC em contêiner M4A; foi copiado sem recodificação).

A trilha de menu acompanha abertura, navegação dos menus e telas de resultado. Ao iniciar uma partida, a dificuldade selecionada escolhe a faixa correspondente. Essa música continua durante as fases, a pausa, as configurações abertas durante a pausa e o painel secreto de cheats. A passagem entre bosses não reinicia a faixa. Reiniciar fase volta ao início da missão e reinicia a faixa atual desde o começo. Ao voltar aos menus, a faixa de menu retoma sua reprodução.

Para respeitar a política de reprodução automática do navegador, a música começa após a primeira interação do jogador com teclado, controle, mouse ou toque.

### 19. Recompensas manuais e Codex em abas

Ao concluir o Foco Final, a recompensa agora aparece em uma janela grande e centralizada com a fotografia, o nome, a descrição e os créditos do boss daquela fase. A tela fica parada e não avança por temporizador: Enter, o botão de confirmação do controle ou um toque do jogador escolhem quando continuar. O botão visível também aceita clique/toque. O tamanho da janela e a área da imagem usam proporções do canvas; imagens são ajustadas sem distorção e os textos são quebrados em linhas para evitar cortes.

O Codex foi dividido em 11 registros navegáveis: Nancy Grace Roman, Hubble, telescópio Roman, duas composições de AG Carinae, Pilares da Criação, coronógrafo, microlentes gravitacionais, energia escura, exoplanetas e luz estelar. Abas, pontos de página e o botão Voltar aceitam clique/toque e a navegação direcional já usada pelo jogo. Escape continua voltando ao menu.

As imagens locais de Nancy, Hubble e telescópio Roman vieram de SpaceTheory/ProjetoSnct e foram copiadas para assets/codex/. Os registros de AG Carinae e dos Pilares reutilizam as imagens de recompensa já existentes em assets/rewards/. Os temas científicos sem imagem correspondente permanecem somente com texto; nenhuma imagem foi buscada na internet.

Para conferir, abra html/index.html, inicie uma partida e conclua a captura de um boss. A recompensa deve permanecer aberta até uma confirmação manual. No menu principal, abra Codex e percorra as abas com as setas/controle, os pontos, clique ou toque.

### 20. Elementos visuais de controle na introdução, configurações e pausa

A introdução da missão foi reorganizada em um briefing com título do boss, retrato local de Nancy Grace Roman, descrição principal, objetivo complementar e comandos do dispositivo ativo. Quando um controle está em uso, a tela mostra a ilustração do controle e os nomes detectados para a família correspondente; teclado e toque recebem ilustrações próprias. Os comandos de P1, P2 e Versus continuam usando as mesmas funções e textos do jogo.

A aba **Configurações → Controle** agora separa o desenho do controle dos grupos de remapeamento. Movimento e ações da missão têm áreas próprias; cada botão diferencia o estado normal, selecionado e aguardando entrada. A arte com letras A/B/X/Y e os ícones de face aparecem apenas quando a detecção é Xbox. PlayStation, Switch e controles genéricos usam uma ilustração neutra sem símbolos de marca e continuam exibindo os nomes fornecidos pela identificação atual do jogo. A ordem e os identificadores usados pelo remapeamento foram mantidos.

A pausa conserva as quatro opções, as vidas e as cartas estelares. O título, as ações, as informações da partida e o guia do dispositivo agora têm áreas alinhadas, com uma ilustração que acompanha teclado, toque ou controle detectado. Os avisos de navegação continuam indicando apenas comandos já existentes. O acesso secreto aos cheats não foi divulgado na interface.

A folha Gemini_Generated_Image_o01ym6o01ym6o01y.jpg foi recortada em PNGs com transparência, removendo o quadriculado do JPEG. Os arquivos criados em assets/sprites/ são control-pad.png, control-dpad.png, control-a.png, control-b.png, control-x.png, control-y.png, control-frame.png e control-frame-focus.png. A captura Downloads/layout foi usada apenas como guia de composição.

Arquivos alterados: js/game.js, os oito recortes em assets/sprites/ e este README. Para conferir, abra html/index.html ou a configuração Open index.html do VS Code. Inicie uma campanha para ver o briefing; em Configurações → Controle, veja a ilustração e remapeie uma ação; durante uma fase, pressione Esc para conferir a pausa.

### 21. Espaçamento da aba de controle

Após a captura do usuário, os títulos “MOVIMENTO” e “AÇÕES DA MISSÃO” foram reposicionados para não invadir as abas Player 1/Player 2 nem encostar nas linhas de remapeamento. A grade foi deslocada para baixo, preservando o espaçamento entre os botões, e a instrução de remapeamento foi reposicionada acima das ações Padrões e Voltar. Nenhum controle, ação ou regra de remapeamento foi alterado.
