const notesEl = document.querySelector("#notes");
const generateBtn = document.querySelector("#generate");
const cancelBtn = document.querySelector("#cancel");
const progressEl = document.querySelector("#progress");
const progressTextEl = document.querySelector("#progress-text");
const messageEl = document.querySelector("#message");
const quizSection = document.querySelector("#quiz-section");
const quizForm = document.querySelector("#quiz-form");
const questionsEl = document.querySelector("#questions");
const scoreBtn = document.querySelector("#score");
const resultsEl = document.querySelector("#results");
const scoreTextEl = document.querySelector("#score-text");
const failuresEl = document.querySelector("#failures");

const OPTION_LETTERS = ["A", "B", "C", "D"];

let currentQuizId = null;
let questionCount = 0;
let controller = null;

function show(element) {
  element.classList.remove("hidden");
}

function hide(element) {
  element.classList.add("hidden");
}

function showMessage(text, isError) {
  messageEl.textContent = text;
  messageEl.classList.remove(
    "hidden",
    "bg-red-50",
    "text-red-700",
    "bg-slate-200",
    "text-slate-700",
  );
  messageEl.classList.add(
    isError ? "bg-red-50" : "bg-slate-200",
    isError ? "text-red-700" : "text-slate-700",
  );
  show(messageEl);
}

function hideMessage() {
  hide(messageEl);
  messageEl.textContent = "";
}

function setBusy(busy) {
  generateBtn.disabled = busy;
  notesEl.readOnly = busy;
  if (busy) {
    show(progressEl);
    progressEl.classList.add("flex");
    show(cancelBtn);
  } else {
    hide(progressEl);
    progressEl.classList.remove("flex");
    hide(cancelBtn);
  }
}

function clearQuiz() {
  currentQuizId = null;
  questionCount = 0;
  questionsEl.replaceChildren();
  failuresEl.replaceChildren();
  scoreTextEl.textContent = "";
  hide(quizSection);
  hide(resultsEl);
}

function renderQuestions(questions) {
  questionsEl.replaceChildren();

  questions.forEach((item, index) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "rounded-xl bg-white p-5 shadow-sm";

    const legend = document.createElement("legend");
    legend.className = "px-1 text-base font-semibold";
    legend.textContent = `${index + 1}. ${item.question}`;
    fieldset.append(legend);

    OPTION_LETTERS.forEach((letter) => {
      const label = document.createElement("label");
      label.className =
        "mt-2 flex cursor-pointer items-start gap-2 text-sm text-slate-700";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${index}`;
      input.value = letter;
      input.className = "mt-0.5";

      const text = document.createElement("span");
      text.textContent = `${letter}. ${item.options[letter]}`;

      label.append(input, text);
      fieldset.append(label);
    });

    questionsEl.append(fieldset);
  });
}

function collectAnswers() {
  return Array.from({ length: questionCount }, (_, index) => {
    const checked = quizForm.querySelector(
      `input[name="question-${index}"]:checked`,
    );
    return checked ? checked.value : null;
  });
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function renderResults(result) {
  scoreTextEl.textContent = result.score;
  failuresEl.replaceChildren();

  if (result.failed.length === 0) {
    const item = document.createElement("li");
    item.className = "rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800";
    item.textContent = "Todas las respuestas son correctas.";
    failuresEl.append(item);
  } else {
    result.failed.forEach((failure) => {
      const item = document.createElement("li");
      item.className = "rounded-lg border border-red-200 bg-red-50 p-4";

      const title = document.createElement("p");
      title.className = "font-semibold text-red-900";
      title.textContent = `${failure.position}. ${failure.question}`;

      const selected = document.createElement("p");
      selected.className = "mt-2 text-sm text-red-800";
      selected.textContent = failure.selected
        ? `Tu respuesta: ${failure.selected}. ${failure.selectedText}`
        : "Tu respuesta: sin responder";

      const correct = document.createElement("p");
      correct.className = "mt-1 text-sm text-slate-700";
      correct.textContent = `Respuesta correcta: ${failure.correct}. ${failure.correctText}`;

      const explanation = document.createElement("p");
      explanation.className = "mt-1 text-sm text-slate-600";
      explanation.textContent = `Explicación: ${failure.explanation}`;

      item.append(title, selected, correct, explanation);
      failuresEl.append(item);
    });
  }

  show(resultsEl);
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleGenerate() {
  hideMessage();
  clearQuiz();

  controller = new AbortController();
  const startedAt = Date.now();
  progressTextEl.textContent = "Generando cuestionario... 0 s";
  setBusy(true);

  const timer = setInterval(() => {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    progressTextEl.textContent = `Generando cuestionario... ${seconds} s`;
  }, 1000);

  try {
    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: notesEl.value }),
      signal: controller.signal,
    });
    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(data?.error ?? "No se pudo generar el cuestionario.");
    }

    currentQuizId = data.id;
    questionCount = data.questions.length;
    renderQuestions(data.questions);
    show(quizSection);
  } catch (error) {
    if (error.name === "AbortError") {
      showMessage("Generación cancelada. El texto se conserva.", false);
    } else {
      showMessage(error.message, true);
    }
  } finally {
    clearInterval(timer);
    controller = null;
    setBusy(false);
  }
}

async function handleScore(event) {
  event.preventDefault();

  if (!currentQuizId) {
    showMessage("Primero genera un cuestionario.", true);
    return;
  }

  hideMessage();
  scoreBtn.disabled = true;

  try {
    const response = await fetch("/api/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: currentQuizId,
        answers: collectAnswers(),
      }),
    });
    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(data?.error ?? "No se pudo corregir el cuestionario.");
    }

    renderResults(data);
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    scoreBtn.disabled = false;
  }
}

generateBtn.addEventListener("click", handleGenerate);
cancelBtn.addEventListener("click", () => {
  if (controller) {
    controller.abort();
  }
});
quizForm.addEventListener("submit", handleScore);
