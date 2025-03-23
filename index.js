// Visit counter logic
document.addEventListener('DOMContentLoaded', async () => {
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

// Form submission handler
document.getElementById("userForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const persona = document.getElementById("persona").value;
  const edge = document.getElementById("edge").value;
  const projectKey = document.getElementById("projectKey").value;
  const jiraUser = document.getElementById("jiraUser").value;
  const jiraLabel = document.getElementById("jiraLabel").value;

  // ✅ Structured GPT-friendly prompt
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
      "acceptanceCriteria": ["criteria 1", "criteria 2"],
      "tasks": ["task 1", "task 2"]
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

    if (response.ok && result.epic && result.stories) {
      const epic = result.epic;
      const stories = result.stories;

      document.getElementById('epicSummary').innerText = 'Summary: ' + epic.summary;
      document.getElementById('epicDescription').innerText = 'Description: ' + epic.description;

      const storiesList = document.getElementById('storiesList');
      storiesList.innerHTML = '';

      stories.forEach(story => {
        const li = document.createElement('li');

        // Create basic story text
        let storyText = `Summary: ${story.summary}\nDescription: ${story.description}`;

        // Add acceptance criteria
        if (story.acceptanceCriteria && story.acceptanceCriteria.length) {
          storyText += `\nAcceptance Criteria:\n - ${story.acceptanceCriteria.join('\n - ')}`;
        }

        // Add tasks
        if (story.tasks && story.tasks.length) {
          storyText += `\nTasks:\n - ${story.tasks.join('\n - ')}`;
        }

        li.innerText = storyText;
        storiesList.appendChild(li);
      });

      document.getElementById('gptResponse').style.display = 'block';
    } else {
      alert("Error: " + (result.error || "Invalid response structure."));
    }
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Something went wrong while submitting the form.");
  }
});
