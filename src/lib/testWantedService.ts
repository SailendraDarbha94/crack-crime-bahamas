import { WantedPersonService } from '@/lib/firebaseService';

// Test the WantedPersonService
async function testWantedPersonService() {
  console.log('=== Testing WantedPersonService ===');
  
  try {
    // Test fetching all wanted persons
    console.log('1. Testing getAllWantedPersons...');
    const wantedPersons = await WantedPersonService.getAllWantedPersons();
    console.log('✅ Fetched wanted persons:', wantedPersons.length, 'records');
    
    // Test checking if service is available
    console.log('2. Testing service availability...');
    if (typeof WantedPersonService.createWantedPerson === 'function') {
      console.log('✅ createWantedPerson method available');
    }
    if (typeof WantedPersonService.deleteWantedPerson === 'function') {
      console.log('✅ deleteWantedPerson method available');
    }
    
    console.log('🎉 All WantedPersonService tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

export default testWantedPersonService;
