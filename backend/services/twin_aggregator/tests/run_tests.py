import sys
import os

# Adjust path to find the packages correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from services.twin_aggregator.tests.test_twin_aggregator import (
    test_twin_map_state_schema,
    test_extract_location,
    test_extract_severity,
    test_compute_diff,
    test_normalize_entity,
)

if __name__ == "__main__":
    print("Running Twin Aggregator tests...")
    try:
        test_twin_map_state_schema()
        print("- test_twin_map_state_schema passed")
        
        test_extract_location()
        print("- test_extract_location passed")
        
        test_extract_severity()
        print("- test_extract_severity passed")
        
        test_compute_diff()
        print("- test_compute_diff passed")
        
        test_normalize_entity()
        print("- test_normalize_entity passed")
        
        print("All tests passed successfully!")
    except AssertionError as e:
        print(f"Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
