import pytest
import os
import datetime
import subprocess
import sys

def run_design_tests():
    """Run the design test suite and generate reports."""
    # Create reports directory if it doesn't exist
    if not os.path.exists('reports'):
        os.makedirs('reports')
    
    # Generate timestamp for report filename
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = f'reports/design_report_{timestamp}.html'
    
    # Run pytest with HTML report
    pytest_args = [
        'design_tests.py',
        f'--html={report_file}',
        '--self-contained-html',
        '-v'
    ]
    
    print("\nRunning design tests...")
    print("Testing professional appearance of all pages...")
    print(f"Report will be saved to {report_file}")
    
    result = pytest.main(pytest_args)
    
    if result == 0:
        print("\nAll design tests passed! The website maintains a professional appearance.")
    else:
        print("\nSome design tests failed. Please check the report for details.")
    
    # Open the report in the default browser
    if sys.platform == 'darwin':  # macOS
        subprocess.run(['open', report_file])
    elif sys.platform == 'win32':  # Windows
        os.startfile(report_file)
    else:  # Linux
        subprocess.run(['xdg-open', report_file])

if __name__ == "__main__":
    run_design_tests() 