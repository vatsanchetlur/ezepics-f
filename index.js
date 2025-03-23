// Ensure the download buttons are disabled on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  // Explicitly disable the download buttons
  document.getElementById("downloadJsonBtn").disabled = true;
  document.getElementById("downloadPdfBtn").disabled = true;

  // Count visits using localStorage
  if (localStorage.getItem('visitCount')) {
    localStorage.setItem('visitCount', Number(localStorage.getItem('visitCount')) + 1);
  } else {
    localStorage.setItem('visitCount', 1);
  }
  const counterElement = document.getElementById('visitCounter');
  if (counterElement) {
    counterElement.innerText = 'Number of visits: ' + localStorage.getItem('visitCount');
  }

  // Load Prompt Library options from backend
  try {
    const res = await fetch('https://ezepics-backend.onrender.com/api/prompts');
    const promptData = await res.json();
    const edgeSelect = document.getElementById('edge');
    promptData.prompts.forEach(prompt => {
      const option = document.createElement('option');
      option.value = prompt;
      option.textContent = prompt;
      edgeSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load prompt library:', err);
  }
});

let latestJson = null; // Global variable to store latest GPT response

// Form submission handler
document.getElementById("userForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Show spinner and hide message
  const spinner = document.getElementById("spinner");
  const resultMessage = document.getElementById("resultMessage");
  spinner.style.display = "block";
  resultMessage.style.display = "none";

  const persona = document.getElementById("persona").value;
  const edge = document.getElementById("edge").value;
  const projectKey = document.getElementById("projectKey").value;
  const jiraUser = document.getElementById("jiraUser").value;
  const jiraLabel = document.getElementById("jiraLabel").value;

  // Build a structured prompt for GPT
  const prompt = `
You are a product owner generating Agile documentation.

Persona:
${persona}

Task:
${edge}

Return the response as JSON in this format:
{
  "epic": {
    "summary": "string",
    "description": "string"
  },
  "stories": [
    {
      "summary": "string",
      "description": "string",
      "acceptanceCriteria": ["criteria1", "criteria2"],
      "tasks": ["task1", "task2"]
    }
  ]
}
`;

  const payload = { persona, edge, projectKey, jiraUser, jiraLabel, prompt };
  console.log("Sending data to backend:", payload);

  try {
    const response = await fetch("https://ezepics-backend.onrender.com/api/generate-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log("Received from backend:", result);

    // Hide spinner once response is received
    spinner.style.display = "none";

    if (response.ok && result.epic && result.stories) {
      latestJson = result; // Save the response for download buttons

      // Enable the download buttons
      document.getElementById("downloadJsonBtn").disabled = false;
      document.getElementById("downloadPdfBtn").disabled = false;

      // Display "Results are ready" message
      resultMessage.innerText = "Results are ready";
      resultMessage.style.display = "block";

      console.log("Formatted GPT JSON:", JSON.stringify(result, null, 2));
    } else {
      alert("Error: " + (result.error || "Invalid response structure."));
    }
  } catch (err) {
    // Hide spinner if there's an error
    spinner.style.display = "none";
    console.error("Fetch error:", err);
    alert("Something went wrong while submitting the form.");
  }
});

// Download JSON button handler
document.getElementById("downloadJsonBtn").addEventListener("click", () => {
  if (!latestJson) return;
  const blob = new Blob([JSON.stringify(latestJson, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'epic-stories.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Download PDF button handler (requires jsPDF)
document.getElementById("downloadPdfBtn").addEventListener("click", () => {
  if (!latestJson) return;
  const { epic, stories } = latestJson;
  const doc = new window.jspdf.jsPDF();

  doc.setFontSize(16);
  doc.text("EZEPICS - Epic & Stories", 10, 15);

  doc.setFontSize(12);
  doc.text(`Epic Summary: ${epic.summary}`, 10, 30);
  doc.text(`Epic Description: ${epic.description}`, 10, 40);

  let y = 55;
  stories.forEach((story, i) => {
    doc.text(`Story ${i + 1}: ${story.summary}`, 10, y);
    y += 7;
    doc.text(`Description: ${story.description}`, 10, y);
    y += 7;
    if (story.acceptanceCriteria?.length) {
      doc.text("Acceptance Criteria:", 10, y);
      y += 6;
      story.acceptanceCriteria.forEach(c => {
        doc.text(`• ${c}`, 14, y);
        y += 6;
      });
    }
    if (story.tasks?.length) {
      doc.text("Tasks:", 10, y);
      y += 6;
      story.tasks.forEach(t => {
        doc.text(`- ${t}`, 14, y);
        y += 6;
      });
    }
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save('epic-stories.pdf');
});
