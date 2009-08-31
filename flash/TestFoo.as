package {
  import org.windmill.TestCase;

  public class TestFoo extends TestCase {
    public function setup():void {
      trace('Set up this bitch.');      
    }
    public function testAsdf():void {
      asserts.assertDisplayObject({id: 'mainPane'});
    }
    public function testZxcv():void {
      trace('executing this mofo');      
    }
    public function teardown():void {
      trace('Set up this bitch.');      
    }
  }
}

