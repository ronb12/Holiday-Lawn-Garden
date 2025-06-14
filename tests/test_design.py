import unittest
import time
import logging
import subprocess
import atexit
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestDesign(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Start the server before running tests"""
        try:
            cls.server_process = subprocess.Popen(['python3', 'server.py'], 
                                                stdout=subprocess.PIPE,
                                                stderr=subprocess.PIPE)
            time.sleep(2)  # Wait for server to start
            atexit.register(cls.tearDownClass)
        except Exception as e:
            logger.error(f"Failed to start server: {e}")
            raise

    @classmethod
    def tearDownClass(cls):
        """Stop the server after tests"""
        if hasattr(cls, 'server_process'):
            cls.server_process.terminate()
            cls.server_process.wait()

    def setUp(self):
        """Set up test environment"""
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # Run in headless mode
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(10)
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get("http://localhost:8000")

    def tearDown(self):
        """Clean up after each test"""
        if hasattr(self, 'driver'):
            self.driver.quit()

    def retry_with_fix(self, test_func, max_attempts=3):
        """Retry a test function with automatic fixes between attempts"""
        attempt = 1
        last_error = None
        
        while attempt <= max_attempts:
            try:
                return test_func()
            except Exception as e:
                last_error = e
                logger.warning(f"Attempt {attempt} failed: {str(e)}")
                if attempt < max_attempts:
                    self.fix_common_issues()
                attempt += 1
        
        raise last_error

    def fix_common_issues(self):
        """Attempt to fix common issues between test retries"""
        try:
            # Refresh the page
            self.driver.refresh()
            time.sleep(1)
            
            # Close any modals
            try:
                modal_close = self.driver.find_element(By.CSS_SELECTOR, ".modal-close")
                modal_close.click()
            except NoSuchElementException:
                pass
            
            # Handle any alerts
            try:
                alert = self.driver.switch_to.alert
                alert.accept()
            except:
                pass
            
            # Verify we're on the right page
            if not self.driver.current_url.startswith("http://localhost:8000"):
                self.driver.get("http://localhost:8000")
            
            # Clear any input fields
            inputs = self.driver.find_elements(By.TAG_NAME, "input")
            for input_field in inputs:
                try:
                    input_field.clear()
                except:
                    pass
            
            # Reset any dropdowns
            selects = self.driver.find_elements(By.TAG_NAME, "select")
            for select in selects:
                try:
                    select.click()
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"Error during fix attempt: {e}")

    def test_typography(self):
        """Test typography styles"""
        def _test():
            body = self.driver.find_element(By.TAG_NAME, "body")
            body_font = body.value_of_css_property("font-family")
            self.assertIn("Montserrat", body_font, "Body text should use Montserrat font")
        
        self.retry_with_fix(_test)

    def test_button_styles(self):
        """Test button styles"""
        def _test():
            # Test CTA buttons in hero section
            hero_buttons = self.driver.find_elements(By.CSS_SELECTOR, ".hero-buttons .cta-button")
            self.assertTrue(len(hero_buttons) > 0, "Should have CTA buttons in hero section")
            for button in hero_buttons:
                self.assertTrue(button.is_displayed(), "Hero CTA button should be visible")

            # Test hamburger menu button only at mobile width
            self.driver.set_window_size(500, 800)
            time.sleep(1)  # Allow layout to update
            hamburger = self.driver.find_element(By.CLASS_NAME, "hamburger")
            self.assertTrue(hamburger.is_displayed(), "Hamburger menu button should be visible at mobile width")
            # Restore window size
            self.driver.set_window_size(1200, 800)
        
        self.retry_with_fix(_test)

    def test_hero_section(self):
        """Test hero section elements"""
        def _test():
            hero = self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "hero")))
            self.assertTrue(hero.is_displayed(), "Hero section should be visible")
            
            hero_content = hero.find_element(By.CLASS_NAME, "hero-content")
            self.assertTrue(hero_content.is_displayed(), "Hero content should be visible")
            
            h1 = hero_content.find_element(By.TAG_NAME, "h1")
            self.assertTrue(h1.is_displayed(), "Hero heading should be visible")
        
        self.retry_with_fix(_test)

    def test_navigation(self):
        """Test navigation functionality"""
        def _test():
            # Test main navigation links
            nav_links = self.driver.find_elements(By.CSS_SELECTOR, ".nav-links a:not(#adminLink)")
            self.assertTrue(len(nav_links) > 0, "Should have navigation links")
            
            for link in nav_links:
                href = link.get_attribute("href")
                if href and "localhost:8000" in href:
                    self.assertTrue(link.is_displayed(), f"Navigation link {href} should be visible")
            
            # Test logo link
            logo_link = self.driver.find_element(By.CSS_SELECTOR, ".logo a")
            self.assertTrue(logo_link.is_displayed(), "Logo link should be visible")
        
        self.retry_with_fix(_test)

    def test_service_cards(self):
        """Test service cards display"""
        def _test():
            service_cards = self.driver.find_elements(By.CLASS_NAME, "service-card")
            self.assertTrue(len(service_cards) > 0, "Should have service cards")
            
            for card in service_cards:
                self.assertTrue(card.is_displayed(), "Service card should be visible")
                try:
                    title = card.find_element(By.TAG_NAME, "h3")
                    self.assertTrue(title.is_displayed(), "Service card should have visible title")
                except NoSuchElementException:
                    pass
        
        self.retry_with_fix(_test)

    def test_contact_form(self):
        """Test contact form functionality"""
        def _test():
            self.driver.get("http://localhost:8000/contact.html")
            form = self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
            self.assertTrue(form.is_displayed(), "Contact form should be visible")
            
            required_fields = form.find_elements(By.CSS_SELECTOR, "input[required], textarea[required]")
            self.assertTrue(len(required_fields) > 0, "Form should have required fields")
        
        self.retry_with_fix(_test)

    def test_responsive_images(self):
        """Test responsive image behavior"""
        def _test():
            images = self.driver.find_elements(By.TAG_NAME, "img")
            for img in images:
                try:
                    src = img.get_attribute("src")
                    alt = img.get_attribute("alt")
                    self.assertTrue(src, "Image should have src attribute")
                    self.assertTrue(alt, "Image should have alt text")
                    self.assertTrue(img.is_displayed(), "Image should be visible")
                except StaleElementReferenceException:
                    continue
        
        self.retry_with_fix(_test)

if __name__ == '__main__':
    unittest.main() 