/* 
CHATBOT LOGIC
  * OpenAI chat completion model api is used
    * It takes specially formatted array of objects so it's "aware" of previous conversation

  * conversationArrTemplate will define the chatbod "personality" and role and will be used as a starting point on to which other conversation object will be appended
  
  * Data will be stored to local storage so the chat data is persisted. On each conversation, local storage will be updated
  
  * Netlify serverless function is used to store the OpenAI api key securely so fetching the chat completion will be handled by the serverless function

  * Here we are fetching from the serverless function passing to it the whole conversation array and expecting it to return the new completion
*/

// UI Elements
const chatMessages = document.getElementById("chat-messages");

// Create custom local storage key to persist the chat data in it
const LOCAL_STORAGE_DATA = "chatbot.data";

// Main conversation array template which configures the openai model
const conversationArrTemplate = [{
  "role": "system",
  "content": "You are a highly knowledgeable assistant that is always happy to help with short precise answers."
}]

// Current conversation array - pull data from the strage if there is data or set storage to be a blank template
let currentStorageObject = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DATA)) || conversationArrTemplate;

/* APP MAIN LOGIC */

// Render currenttly stored data
if(currentStorageObject.length > 1) {
  // Loop over objects and render messages
  currentStorageObject.forEach(current => {
    // Human case
    if (current.role == "user") {
      renderChatItem(current.content, "human")
    } else if (current.role == "assistant"){
    // Bot case
    renderChatItem(current.content, "bot-fast")
    }
  })
} else {
  console.log("No persisted data on first render. Proceeding with application normally..")
}

// Add new chat item on submit
document.addEventListener("submit", (e) => {
  // Prevent submitting a form
  e.preventDefault()
  // Grab user input
  const userInput = document.getElementById("user-input")
  // If input is blank, do nothing
  if (userInput.value === ""){
    return;
  }

  // Create object containing user input to be appended to the main conversation array
  let conversationItem = {
    "role": "user", 
    "content": userInput.value
  }

  // Push input to the main conversation array
  currentStorageObject.push(conversationItem);

  // Update local storage
  updateStorage();

  // Fetch reply from the openAI(Netlify-OpenAI-Netlify) and process returned data
  fetchReply();

  // Render human message
  renderChatItem(userInput.value, "human");

  // Reset userInput value
  userInput.value = "";

});

// Create fetch request to the Netlify serverless function
async function fetchReply(){

  // Function url
  const netlifyUrl = "https://jade-sopapillas-3043f2.netlify.app/.netlify/functions/fetchOpenAI"
  
  // Create fetch request and request the data using async-await paradigm and feed the conversation array to it (body: currentStorageObject)
  const response = await fetch(netlifyUrl, {
    "method": "POST",
    "headers": {
      "Content-Type": "text/plain"
    },
    "body": JSON.stringify(currentStorageObject)
  })

  // Cach the response data and resolve it to js object notation
  const data = await response.json();

  // Render bot's message
  renderChatItem(data.reply.choices[0].message.content, "bot")

  // Update the main conversation array
  currentStorageObject.push(data.reply.choices[0].message);

  // Update local storage
  updateStorage();
}

/* CLEAR BUTTON LOGIC */
document.getElementById("clear-button").addEventListener("click", () => {
  // On click of the "clear chat data" button, call remove function to clear local storage
  clearStorage();
  // Clear rendered html to only leave the default message
  chatMessages.innerHTML = `
    <div class="chat-item">
      <p class="chat-item-body sender-bot">What can I do for you?</p>
    </div>
  `;
})

/* UTILITY FUNCTIONS */

// Render chat item (takes input and human/bot/bot-fast)
function renderChatItem(input, sender){
  // Create new chat item and style appropriately
  const chatItem = document.createElement("div");
  chatItem.classList.add("chat-item");
  // Create new chat item's paragraph for message 
  const chatMessage = document.createElement("p");

  // In case I'm rendering user message, proceed without effects
  if(sender.toLowerCase() == "human"){
    chatMessage.classList.add("chat-item-body", "sender-human");
    // Append user input to that paragraph
    chatMessage.textContent = input;
    // Append paragraph to chat item div
    chatItem.append(chatMessage);
    // Add newly created item to the chat interface
    chatMessages.append(chatItem);
  } else if(sender.toLowerCase() =="bot"){
      // In case I'm rendering bot's message, proceed with typewritter effect
      renderTypewriterText(input, chatItem, chatMessage);
  } else if (sender.toLowerCase() == "bot-fast") {
      // In case I need bot content rendered but without typewriting effect
      chatMessage.classList.add("chat-item-body", "sender-bot");
      // Append user input to that paragraph
      chatMessage.textContent = input;
      // Append paragraph to chat item div
      chatItem.append(chatMessage);
      // Add newly created item to the chat interface
      chatMessages.append(chatItem);
    }
  // Show always bottom of thei interface (last, recent item)
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Render text with typewritter effect (takes input and two needed elemets for dom placement)
function renderTypewriterText(input, div, p) {
  // Style the chat paragraph appropriately
  p.classList.add("chat-item-body", "sender-bot", "blinking-effect");
  // Append paragraph to chat item div
  div.append(p);
  // Add newly created item to the chat interface
  chatMessages.append(div);

  // Using setInterval(), will repeat adding letter by letter with substring(current, current+1) untill it's written fully
  // Current iteration
  let position = 0;
  // Total lenght of original input
  let len = input.length;
  const interval = setInterval(() => {
    // If current iteration is equal to total lenght, means we are done here
    if(position === len){
      p.classList.remove("blinking-effect");
      clearInterval(interval)
    }
    p.textContent += input.substring(position, position + 1)
    position += 1;

    // Show always bottom of thei interface (last, recent item)
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 60);
}

// Save data to local storage object
function updateStorage() {
  // If there is data, delete everyhing
  if(localStorage.getItem(LOCAL_STORAGE_DATA)) {
    localStorage.removeItem(LOCAL_STORAGE_DATA)
  }
  // Save current conversation array
  localStorage.setItem(LOCAL_STORAGE_DATA, JSON.stringify(currentStorageObject));
}

// Clear storage
function clearStorage(){
  // If there is data, delete everyhing
  if(localStorage.getItem(LOCAL_STORAGE_DATA)) {
    localStorage.removeItem(LOCAL_STORAGE_DATA)
  }
}