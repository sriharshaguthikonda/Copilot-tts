// Load the Perplexity URL from local storage
chrome.storage.local.get('sidePanelUrl', (data) => {
    const contentDiv = document.getElementById('perplexity-content');
    const sidePanelUrl = data.sidePanelUrl || 'https://www.perplexity.ai/';
    fetch(sidePanelUrl)
      .then(response => response.text())
      .then(html => {
        contentDiv.innerHTML = html;
      })
      .catch(error => console.error('Error loading Perplexity content:', error));
  });
  
  // TTS function
  const speakText = (text) => {
    chrome.tts.speak(text, {
      'lang': 'en-GB',
      'rate': 1.4,
      'voiceName': 'Google UK English Female'
    });
  };
  
  // Add event listener to the TTS button
  document.getElementById('read-aloud-button').addEventListener('click', () => {
    const contentDiv = document.getElementById('perplexity-content');
    const textElements = contentDiv.querySelectorAll('p, span, h1, h2, h3');
    let textToRead = '';
    textElements.forEach(element => {
      textToRead += element.innerText + ' ';
    });
    speakText(textToRead);
  });
  