// src/scripts/engine.js
// Código revisado para inicialização segura, correções de DOM e implementações faltantes.

const state = {
  score: {
    playerScore: 0,
    computerScore: 0,
    scoreBox: null, // será cacheado no init
  },
  cardSprites: {
    avatar: null,
    name: null,
    type: null,
  },
  fieldCards: {
    player: null,
    computer: null,
  },
  playerSides: {
    // nomes (strings) e referências a elementos serão setados no init()
    player1: "player-cards",
    player1BOX: null,
    computer: "computer-cards",
    computerBOX: null,
  },
  actions: {
    button: null,
  },
};

const playerSides = {
  player1: "player-cards",
  computer: "computer-cards",
};

const pathImages = "src/assets/icons/"; // relativo ao index.html (sem ./ para evitar confusões)

const cardData = [
  {
    id: 0,
    name: "Blue eyes White Dragon",
    type: "Paper",
    img: `${pathImages}dragon.png`,
    WinOf: [1],
    LoseOf: [2],
  },
  {
    id: 1,
    name: "Dark Magician",
    type: "Rock",
    img: `${pathImages}magician.png`,
    WinOf: [2],
    LoseOf: [0],
  },
  {
    id: 2,
    name: "Exodia",
    type: "Scissors",
    img: `${pathImages}exodia.png`,
    WinOf: [0],
    LoseOf: [1],
  },
];

// bloqueio de entrada enquanto o round é processado
let allowInput = true;

function cacheDOM() {
  state.score.scoreBox = document.getElementById("score_points");
  state.cardSprites.avatar = document.getElementById("card-image");
  state.cardSprites.name = document.getElementById("card-name");
  state.cardSprites.type = document.getElementById("card-type");
  state.fieldCards.player = document.getElementById("player-field-card");
  state.fieldCards.computer = document.getElementById("computer-field-card");
  state.playerSides.player1BOX = document.querySelector("#player-cards");
  state.playerSides.computerBOX = document.querySelector("#computer-cards");
  state.actions.button = document.getElementById("next-duel");
}

function safeNumber(v) {
  // garante number coerente a partir de string ou number
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function getRandomCardId() {
  const randomIndex = Math.floor(Math.random() * cardData.length);
  return cardData[randomIndex].id;
}

function createCardImage(IdCard, fieldSide) {
  const cardImage = document.createElement("img");
  cardImage.setAttribute("height", "100px");
  // usar caminho relativo consistente (sem ./ no começo)
  cardImage.setAttribute("src", `${pathImages}card-back.png`);
  cardImage.setAttribute("data-id", IdCard);
  cardImage.classList.add("card");

  if (fieldSide === playerSides.player1) {
    cardImage.addEventListener("mouseover", () => {
      drawSelectedCard(IdCard);
    });
    cardImage.addEventListener("click", (ev) => {
      if (!allowInput) return;
      // data-id pode ser string, converter
      const id = safeNumber(cardImage.getAttribute("data-id"));
      setCardsField(id);
    });
  }
  return cardImage;
}

async function setCardsField(cardId) {
  if (!allowInput) return;
  allowInput = false;

  // garante que cardId é number
  cardId = safeNumber(cardId);

  // remove todas as cartas antes
  await removeAllCardsImages();

  const computerCardId = getRandomCardId();

  // Mostrar os campos (reveal)
  showHiddenCardFieldsImages(true);

  // esconder detalhes enquanto animando
  hiddenCardDetails();

  // desenha as cartas nos campos (mostra frente)
  drawCardsInField(cardId, computerCardId);

  // checa resultado
  const duelResults = checkDuelResults(cardId, computerCardId);

  // atualiza score e UI
  updateScore();

  // desenha botão com o texto do resultado
  drawButton(await duelResults);

  allowInput = true;
}

function drawCardsInField(cardId, computerCardId) {
  const pId = Number(cardId);
  const cId = Number(computerCardId);

  // Carta do jogador
  if (state.fieldCards.player) {
    state.fieldCards.player.src = cardData[pId].img;
    state.fieldCards.player.style.display = "block";
  }

  // Carta do computador
  if (state.fieldCards.computer) {
    state.fieldCards.computer.src = cardData[cId].img;
    state.fieldCards.computer.style.display = "block";
  }
}

function showHiddenCardFieldsImages(show = true) {
  const display = show ? "block" : "none";

  if (state.fieldCards.player) {
    state.fieldCards.player.style.display = display;
    if (!show) state.fieldCards.player.src = "";
  }

  if (state.fieldCards.computer) {
    state.fieldCards.computer.style.display = display;
    if (!show) state.fieldCards.computer.src = "";
  }
}

function removeAllCardsImages() {
  const { computerBOX, player1BOX } = state.playerSides;

  // remove mãos
  if (computerBOX) {
    computerBOX.querySelectorAll("img").forEach((img) => img.remove());
  }
  if (player1BOX) {
    player1BOX.querySelectorAll("img").forEach((img) => img.remove());
  }

  // limpa cartas do campo também
  if (state.fieldCards.player) {
    state.fieldCards.player.src = "";
    state.fieldCards.player.style.display = "none";
  }
  if (state.fieldCards.computer) {
    state.fieldCards.computer.src = "";
    state.fieldCards.computer.style.display = "none";
  }
}


function hiddenCardDetails() {
  if (state.cardSprites.avatar) state.cardSprites.avatar.src = "";
  if (state.cardSprites.name) state.cardSprites.name.innerText = "";
  if (state.cardSprites.type) state.cardSprites.type.innerText = "";
}

function drawButton(text) {
  if (!state.actions.button) return;
  state.actions.button.innerText = text;
  state.actions.button.style.display = "block";
}

function updateScore() {
  if (!state.score.scoreBox) return;
  state.score.scoreBox.innerText = `Win: ${state.score.playerScore} | Lose: ${state.score.computerScore}`;
}

async function checkDuelResults(playerCardId, computerCardId) {
  let duelResults = "draw";
  const playerCard = cardData[safeNumber(playerCardId)];
  const computerCard = cardData[safeNumber(computerCardId)];

  if (!playerCard || !computerCard) {
    // fallback
    await playAudio("draw");
    return "draw";
  }

  if (playerCard.WinOf.includes(computerCard.id)) {
    duelResults = "win";
    state.score.playerScore++;
  } else if (playerCard.LoseOf.includes(computerCard.id)) {
    duelResults = "lose";
    state.score.computerScore++;
  } else {
    duelResults = "draw";
  }

  await playAudio(duelResults);
  return duelResults;
}

async function removeAllCardsImages() {
  const { computerBOX, player1BOX } = state.playerSides;

  if (computerBOX) {
    const imgs = computerBOX.querySelectorAll("img");
    imgs.forEach((img) => img.remove());
  }

  if (player1BOX) {
    const imgs2 = player1BOX.querySelectorAll("img");
    imgs2.forEach((img) => img.remove());
  }
}

function drawSelectedCard(index) {
  const idx = safeNumber(index);
  const card = cardData[idx];
  if (!card) return;
  if (state.cardSprites.avatar) state.cardSprites.avatar.src = card.img;
  if (state.cardSprites.name) state.cardSprites.name.innerText = card.name;
  if (state.cardSprites.type) state.cardSprites.type.innerText = "Attribute: " + card.type;
}

function drawCards(cardNumbers, fieldSide) {
  for (let i = 0; i < cardNumbers; i++) {
    const randomIdCard = getRandomCardId();
    const cardImage = createCardImage(randomIdCard, fieldSide);
    const container = document.getElementById(fieldSide);
    if (container) container.appendChild(cardImage);
  }
}

function resetDuel() {
  hiddenCardDetails();
  if (state.actions.button) state.actions.button.style.display = "none";
  showHiddenCardFieldsImages(false);
  // limpa imagens em mãos
  removeAllCardsImages();
  init(); // reinicia
}

async function playAudio(status) {
  // Verifica se o arquivo existe antes de tentar tocar
  const audioPath = `src/assets/audios/${status}.wav`;
  const availableAudios = ["win", "lose", "draw"];
  if (!availableAudios.includes(status)) return;
  try {
    const audio = new Audio(audioPath);
    await audio.play();
  } catch (err) {
    // fail silently (autoplay restrictions etc.)
    console.warn("audio playback failed:", err);
  }
}

function init() {
  // cache de elementos (garantido ser chamado após DOMContentLoaded)
  cacheDOM();

  // esconde campos e botão
  showHiddenCardFieldsImages(false);
  if (state.actions.button) state.actions.button.style.display = "none";

  // popula mãos
  drawCards(5, playerSides.player1);
  drawCards(5, playerSides.computer);

  // tenta tocar BGM (pode ser bloqueado pelo navegador)
  const bgm = document.getElementById("bgm");
  if (bgm) {
    // se for <audio id="bgm"> no HTML
    const playPromise = bgm.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => {
        // autoplay bloqueado; é ok, toque quando usuário interagir
        console.warn("BGM play prevented:", err);
      });
    }
  }

  // botão next-duel... se quiser reiniciar
  if (state.actions.button) {
    state.actions.button.addEventListener("click", () => {
      // se o texto for "Reiniciar" ou similar, reinicia; caso contrário, esconde
      const t = state.actions.button.innerText.toLowerCase();
      if (t.includes("reiniciar") || t.includes("restart")) {
        resetDuel();
      } else {
        // esconder botão após clique
        state.actions.button.style.display = "none";
      }
    });
  }
}

// espera DOM pronto
document.addEventListener("DOMContentLoaded", () => {
  init();
});

