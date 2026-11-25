const quizSets = {
  fundamental1: {
    label: 'FUNDAMENTAL I',
    questions: [
      { question: 'Em qual cidade Nancy Grace Roman nasceu?', options: ['Reno', 'Nashville', 'Chicago', 'Baltimore'], answer: 1, explanation: 'Nancy nasceu em Nashville, no estado do Tennessee, nos Estados Unidos.' },
      { question: 'Qual era a área de estudo e trabalho de Nancy?', options: ['Oceanografia', 'Botânica', 'Astronomia', 'Geologia'], answer: 2, explanation: 'Nancy foi astrônoma e ajudou a desenvolver a astronomia espacial.' },
      { question: 'O que Nancy gostava de observar quando era criança?', options: ['Vulcões', 'Constelações e estrelas', 'Recifes de coral', 'Pegadas de dinossauro'], answer: 1, explanation: 'Ela se encantou pelas constelações ainda criança e organizou um clube de astronomia aos 11 anos.' },
      { question: 'Em qual agência Nancy ajudou a criar um programa de astronomia espacial?', options: ['NOAA', 'ESA', 'NASA', 'NRL'], answer: 2, explanation: 'Nancy entrou na NASA em 1959 para ajudar a criar o programa de astronomia espacial.' },
      { question: 'Qual telescópio ficou ligado ao apelido “mãe do Hubble” dado a Nancy?', options: ['Telescópio de uma escola', 'Telescópio Espacial Hubble', 'Luneta de Galileu', 'Rádio de ondas curtas'], answer: 1, explanation: 'O trabalho de Nancy para defender e organizar o projeto ajudou o Hubble a sair do papel.' },
      { question: 'Por que colocar telescópios acima da atmosfera pode ajudar os astrônomos?', options: ['Para fazer chover', 'Para deixar as estrelas mais quentes', 'Assim os telescópios ficam mais perto das cidades', 'A atmosfera pode bloquear ou distorcer parte da luz'], answer: 3, explanation: 'A atmosfera terrestre interfere em parte da luz que chega do espaço. Observatórios espaciais podem estudar essa luz com mais clareza.' }
    ]
  },
  fundamental2: {
    label: 'FUNDAMENTAL II',
    questions: [
      { question: 'Em que ano Nancy Grace Roman entrou na NASA?', options: ['1946', '1959', '1949', '1969'], answer: 1, explanation: 'Nancy entrou na NASA em 1959, poucos meses depois da criação da agência.' },
      { question: 'Em qual universidade Nancy concluiu seu doutorado em astronomia?', options: ['Swarthmore College', 'Universidade de Brasília', 'Universidade de Chicago', 'Universidade de Reno'], answer: 2, explanation: 'Ela concluiu o doutorado na Universidade de Chicago em 1949.' },
      { question: 'Qual cargo Nancy assumiu na NASA em 1960?', options: ['Diretora de lançamento de foguetes', 'Chefe de Astronomia e Relatividade', 'Astronauta-chefe', 'Presidente da agência'], answer: 1, explanation: 'Em 1960, ela era chefe de Astronomia e Relatividade no Escritório de Ciências Espaciais da NASA.' },
      { question: 'Qual foi uma parte importante do trabalho de Nancy no projeto Hubble?', options: ['Pilotar o telescópio até a órbita', 'Construir sozinha todas as peças', 'Fotografar todas as galáxias', 'Defender a ideia e coordenar o programa com cientistas e engenheiros'], answer: 3, explanation: 'Como cientista do programa, ela promoveu o projeto e ajudou a coordenar o trabalho de muitas equipes.' },
      { question: 'O que pode acontecer com a luz dos astros ao atravessar a atmosfera terrestre?', options: ['Ela vira som', 'Parte dela pode ser bloqueada ou distorcida', 'Ela deixa de existir', 'Ela sempre fica mais brilhante'], answer: 1, explanation: 'A atmosfera pode bloquear ou distorcer a luz. Por isso, telescópios no espaço conseguem observar alguns sinais com mais clareza.' },
      { question: 'Qual nome o telescópio espacial WFIRST recebeu em 2020?', options: ['Nancy Grace Roman Space Telescope', 'Telescópio Nashville', 'Observatório Swarthmore', 'Telescópio Relatividade'], answer: 0, explanation: 'Em 2020, a NASA renomeou o WFIRST em homenagem a Nancy Grace Roman.' },
      { question: 'Quais temas estão entre os objetivos do Telescópio Espacial Roman?', options: ['Oceanos e vulcões terrestres', 'Fósseis e dinossauros', 'Energia escura e exoplanetas', 'Clima e florestas da Terra'], answer: 2, explanation: 'A missão foi planejada para investigar energia escura, exoplanetas e outros temas de astrofísica.' },
      { question: 'Com que idade Nancy organizou um clube de astronomia com colegas?', options: ['6 anos', '18 anos', '30 anos', '11 anos'], answer: 3, explanation: 'Aos 11 anos, Nancy organizou um clube de astronomia com colegas em Reno.' }
    ]
  }
};

const activeQuestions = [
  ...quizSets.fundamental1.questions,
  ...quizSets.fundamental2.questions
];

const questionPanel = document.querySelector('#question-panel');
const resultPanel = document.querySelector('#result-panel');
const answerList = document.querySelector('#answer-list');
const questionText = document.querySelector('#question-text');
const questionCount = document.querySelector('#question-count');
const scoreCount = document.querySelector('#score-count');
const feedback = document.querySelector('#answer-feedback');
const nextButton = document.querySelector('#next-question');
const progressBar = document.querySelector('#quiz-progress');
const progressTrack = document.querySelector('.quiz-progress-track');
const resultTitle = document.querySelector('#result-title');
let questionIndex = 0;
let score = 0;
let answered = false;

function renderQuestion(shouldFocus = false) {
  const item = activeQuestions[questionIndex];
  const firstLevelCount = quizSets.fundamental1.questions.length;
  const inFirstLevel = questionIndex < firstLevelCount;
  const levelLabel = inFirstLevel ? quizSets.fundamental1.label : quizSets.fundamental2.label;
  const levelQuestionNumber = inFirstLevel ? questionIndex + 1 : questionIndex - firstLevelCount + 1;
  const levelQuestionCount = inFirstLevel ? firstLevelCount : quizSets.fundamental2.questions.length;

  answered = false;
  questionCount.textContent = levelLabel + ' · PERGUNTA ' + levelQuestionNumber + ' DE ' + levelQuestionCount;
  scoreCount.textContent = 'PONTOS: ' + score;
  questionText.textContent = item.question;
  feedback.textContent = '';
  feedback.className = 'quiz-feedback';
  nextButton.hidden = true;
  answerList.replaceChildren();

  item.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-answer';
    button.textContent = String.fromCharCode(65 + index) + '. ' + option;
    button.addEventListener('click', () => chooseAnswer(index));
    answerList.append(button);
  });

  const progress = Math.round((questionIndex / activeQuestions.length) * 100);
  progressBar.style.width = String(progress) + '%';
  progressTrack.setAttribute('aria-valuenow', String(progress));
  if (shouldFocus) questionText.focus();
}

function chooseAnswer(selectedIndex) {
  if (answered) return;
  answered = true;
  const item = activeQuestions[questionIndex];
  const buttons = [...answerList.querySelectorAll('.quiz-answer')];
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === item.answer) button.classList.add('is-correct');
    if (index === selectedIndex && index !== item.answer) button.classList.add('is-wrong');
  });

  if (selectedIndex === item.answer) {
    score += 1;
    feedback.textContent = 'Acertou! ' + item.explanation;
    feedback.classList.add('is-good');
  } else {
    feedback.textContent = 'Quase! ' + item.explanation;
    feedback.classList.add('is-try-again');
  }

  scoreCount.textContent = 'PONTOS: ' + score;
  const progress = Math.round(((questionIndex + 1) / activeQuestions.length) * 100);
  progressBar.style.width = String(progress) + '%';
  progressTrack.setAttribute('aria-valuenow', String(progress));
  nextButton.textContent = questionIndex === activeQuestions.length - 1 ? 'Ver resultado' : 'Continuar';
  nextButton.hidden = false;
  nextButton.focus();
}

nextButton.addEventListener('click', () => {
  questionIndex += 1;
  if (questionIndex < activeQuestions.length) {
    renderQuestion(true);
  } else {
    showResult();
  }
});

function showResult() {
  questionPanel.hidden = true;
  resultPanel.hidden = false;
  const percent = Math.round((score / activeQuestions.length) * 100);
  document.querySelector('#result-score').textContent = score + ' de ' + activeQuestions.length + ' respostas certas · ' + percent + '%';
  const message = document.querySelector('#result-message');

  if (score === activeQuestions.length) {
    resultTitle.textContent = 'Órbita perfeita!';
    message.textContent = 'Você acertou tudo. Releia o site ou tente superar sua pontuação.';
  } else if (score >= Math.ceil(activeQuestions.length / 2)) {
    resultTitle.textContent = 'Missão cumprida!';
    message.textContent = 'Você já sabe bastante sobre Nancy. Releia as respostas e tente chegar ainda mais longe.';
  } else {
    resultTitle.textContent = 'Boa tentativa, explorador!';
    message.textContent = 'Cada resposta é uma descoberta. Volte ao site para rever a história e tente novamente.';
  }

  resultTitle.focus();
}

document.querySelector('#play-again').addEventListener('click', () => {
  questionIndex = 0;
  score = 0;
  resultPanel.hidden = true;
  questionPanel.hidden = false;
  renderQuestion(true);
});

renderQuestion();