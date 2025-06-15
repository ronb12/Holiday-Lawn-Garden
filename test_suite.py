from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import unittest
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WebsiteTestSuite(unittest.TestCase):
    def setUp(self):
        """Set up the test environment before each test."""
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Run in headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        self.driver.implicitly_wait(10)
        self.base_url = "http://localhost:8000"
        
    def tearDown(self):
        """Clean up after each test."""
        self.driver.quit()

    def test_navigation(self):
        """Test the main navigation links."""
        logger.info("Testing navigation links...")
        self.driver.get(self.base_url)
        
        # Test each main navigation link
        nav_links = {
            "Home": "/",
            "About": "/about.html",
            "Services": "/services.html",
            "Contact": "/contact.html",
            "FAQ": "/faq.html"
        }
        
        for link_text, expected_url in nav_links.items():
            try:
                link = self.driver.find_element(By.LINK_TEXT, link_text)
                link.click()
                current_url = self.driver.current_url
                self.assertTrue(current_url.endswith(expected_url),
                              f"Navigation to {link_text} failed. Expected {expected_url}, got {current_url}")
                logger.info(f"Successfully navigated to {link_text}")
            except Exception as e:
                logger.error(f"Error testing {link_text} navigation: {str(e)}")
                raise

    def test_contact_form(self):
        """Test the contact form functionality."""
        logger.info("Testing contact form...")
        self.driver.get(f"{self.base_url}/contact.html")
        
        try:
            # Fill out the form
            self.driver.find_element(By.NAME, "name").send_keys("Test User")
            self.driver.find_element(By.NAME, "email").send_keys("test@example.com")
            self.driver.find_element(By.NAME, "phone").send_keys("1234567890")
            self.driver.find_element(By.NAME, "message").send_keys("This is a test message")
            
            # Submit the form
            submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_button.click()
            
            # Wait for success message
            success_message = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "success-message"))
            )
            self.assertTrue(success_message.is_displayed())
            logger.info("Contact form submitted successfully")
            
        except Exception as e:
            logger.error(f"Error testing contact form: {str(e)}")
            raise

    def test_service_links(self):
        """Test the service section links."""
        logger.info("Testing service links...")
        self.driver.get(f"{self.base_url}/services.html")
        
        service_sections = ["mowing", "landscaping", "pressure-washing", "commercial"]
        
        for section in service_sections:
            try:
                # Find and click the service link
                service_link = self.driver.find_element(By.CSS_SELECTOR, f"a[href='#{section}']")
                service_link.click()
                
                # Wait for the section to be visible
                section_element = WebDriverWait(self.driver, 10).until(
                    EC.visibility_of_element_located((By.ID, section))
                )
                self.assertTrue(section_element.is_displayed())
                logger.info(f"Successfully navigated to {section} section")
                
            except Exception as e:
                logger.error(f"Error testing {section} section: {str(e)}")
                raise

    def test_footer_links(self):
        """Test the footer links and social media icons."""
        logger.info("Testing footer links...")
        self.driver.get(self.base_url)
        
        # Test footer navigation links
        footer_links = self.driver.find_elements(By.CSS_SELECTOR, ".footer-section a")
        for link in footer_links:
            try:
                href = link.get_attribute("href")
                if href and not href.startswith("http"):
                    link.click()
                    time.sleep(1)  # Wait for page load
                    self.assertTrue(self.driver.current_url.startswith(self.base_url))
                    logger.info(f"Successfully tested footer link: {href}")
            except Exception as e:
                logger.error(f"Error testing footer link: {str(e)}")
                continue

    def test_mobile_menu(self):
        """Test the mobile menu functionality."""
        logger.info("Testing mobile menu...")
        self.driver.get(self.base_url)
        
        # Set window size to mobile dimensions
        self.driver.set_window_size(375, 812)
        
        try:
            # Find and click the mobile menu button
            menu_button = self.driver.find_element(By.CLASS_NAME, "mobile-menu-button")
            menu_button.click()
            
            # Wait for menu to be visible
            menu = WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.CLASS_NAME, "mobile-menu"))
            )
            self.assertTrue(menu.is_displayed())
            logger.info("Mobile menu opened successfully")
            
            # Test menu links
            menu_links = menu.find_elements(By.TAG_NAME, "a")
            for link in menu_links:
                try:
                    link.click()
                    time.sleep(1)  # Wait for navigation
                    self.assertTrue(self.driver.current_url.startswith(self.base_url))
                except Exception as e:
                    logger.error(f"Error testing mobile menu link: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error testing mobile menu: {str(e)}")
            raise

def run_tests():
    """Run all tests and generate a report."""
    logger.info("Starting test suite...")
    unittest.main(verbosity=2)

if __name__ == "__main__":
    run_tests() 