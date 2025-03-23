// Visit counter logic
document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('visitCount')) {
    localStorage.setItem('visitCount', Number(localStorage.getItem('visitCount')) + 1);
  } else {
    localStorage.setItem('visitCount', 1);
  }

  const counterElement = document.getElementById('visitCounter');
  if (counterElement) {
    counterElement.innerText = 'Number of visits: ' + localStorage.getItem('visitCount');
  }

  // Load Prompt Library options from server
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

  // ✅ Build prompt using the persona and selected prompt style (edge)
  const prompt = `Based on the user persona: "${persona}", ${edge}, and return the result in JSON format with an Epic and User Stories.`;

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

    if (response.ok) {
      const epic = result.epic;
      const stories = result.stories;

      document.getElementById('epicSummary').innerText = 'Summary: ' + epic.summary;
      document.getElementById('epicDescription').innerText = 'Description: ' + epic.description;

      const storiesList = document.getElementById('storiesList');
      storiesList.innerHTML = '';

      stories.forEach(story => {
        const li = document.createElement('li');
        li.innerText = `Summary: ${story.summary}, Description: ${story.description}`;
        storiesList.appendChild(li);
      });

      document.getElementById('gptResponse').style.display = 'block';
    } else {
      alert("Error: " + result.error);
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while submitting the form.");
  }
});
