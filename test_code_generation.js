// Test script to verify backend connection and code generation
// Run this in your browser console or as a separate test file

async function testCodeGeneration() {
  console.log('Testing code generation...');
  
  try {
    // Test 1: Check if the test endpoint works
    console.log('1. Testing database connection...');
    const testResponse = await fetch('http://localhost:5050/codes/test');
    const testResult = await testResponse.json();
    console.log('Test result:', testResult);
    
    if (!testResult.success) {
      console.error('❌ Database connection failed:', testResult.message);
      if (testResult.setup_required) {
        console.error('🔧 Setup required: Run the database setup script');
      }
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Test 2: Try to generate codes
    console.log('2. Testing code generation...');
    const generateResponse = await fetch('http://localhost:5050/codes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        party_id: 1, // Use an existing party ID
        price_id: 1, // Use an existing price ID
        quantity: 2  // Generate just 2 codes for testing
      })
    });
    
    const generateResult = await generateResponse.json();
    console.log('Generate result:', generateResult);
    
    if (generateResult.success) {
      console.log('✅ Code generation successful');
      console.log('Generated codes:', generateResult.codes);
      console.log('Saved codes:', generateResult.saved_codes);
      
      if (generateResult.saved_codes && generateResult.saved_codes.length > 0) {
        console.log('✅ Codes were saved to database');
      } else {
        console.log('⚠️ Codes were generated but NOT saved to database');
      }
    } else {
      console.error('❌ Code generation failed:', generateResult.message);
    }
    
    // Test 3: Check if codes were actually saved
    console.log('3. Checking saved codes...');
    const getResponse = await fetch('http://localhost:5050/codes/party/1');
    const getResult = await getResponse.json();
    console.log('Get codes result:', getResult);
    
    if (getResult.success) {
      console.log('✅ Retrieved codes:', getResult.codes.length);
    } else {
      console.error('❌ Failed to retrieve codes:', getResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCodeGeneration();
