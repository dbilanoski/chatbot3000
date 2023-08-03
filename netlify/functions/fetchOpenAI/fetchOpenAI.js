const handler = async (event) => {

  const url = "https://api.openai.com/v1/chat/completions"

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: JSON.parse(event.body),
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      }),
    });

    // Await data and resolve it by parsing it as json but converting it to js object
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({reply: data})
    }
  } catch (error) {
      return { statusCode: 500, body: error.toString() }
  }
}

// This exports the handler function so it's available to rest of the app
module.exports = { handler }