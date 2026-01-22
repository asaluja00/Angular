export const environment = {
    // production: false,
    // url1:'https://10.179.82.226:8443',
    // url1:'http://10.179.82.226:8085',
    url1:'https://10.179.82.226:8443',
    url2:'https://10.179.4.9:8067/api/v1',
    url3: 'https://10.179.82.226:8450',
    url4: 'https://10.179.82.226:8543',


    
    // Azure Speech Service configuration
    azureSpeech: {
        subscriptionKey: 'c7582d83ea2f41e29e78a34c1adb562f',
        region: 'centralindia',
        recognitionLanguage: 'en-US',
        voiceName: 'en-US-JennyNeural'
    },
    
    // Azure OpenAI configuration for LLaMA model
    azureOpenAI: {
        // testing purpose, replace with your actual endpoint and key
        endpoint: 'https://10.179.82.226:8443/chat', 
        key: 'your-azure-openai-key',
        model: 'gpt-4'
    },
   
}