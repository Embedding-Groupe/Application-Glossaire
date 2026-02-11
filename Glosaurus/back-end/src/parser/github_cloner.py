import os
import tempfile
import shutil
from git import Repo, GitCommandError
import re

def validate_github_url(url: str) -> bool:
    """
    Validate if the provided URL is a valid GitHub repository URL.
    Accepts formats:
    - https://github.com/user/repo
    - https://github.com/user/repo.git
    - git@github.com:user/repo.git
    """
    patterns = [
        r'^https://github\.com/[\w\-]+/[\w\-\.]+(?:\.git)?$',
        r'^git@github\.com:[\w\-]+/[\w\-\.]+\.git$'
    ]
    
    return any(re.match(pattern, url.strip()) for pattern in patterns)


def clone_github_repo(repo_url: str) -> tuple[str, str]:
    """
    Clone a GitHub repository to a temporary directory.
    
    Args:
        repo_url: The GitHub repository URL
        
    Returns:
        tuple: (temp_directory_path, error_message)
               If successful, error_message is None
               If failed, temp_directory_path is None
    """
    # Validate URL format
    if not validate_github_url(repo_url):
        return None, "Invalid GitHub URL format. Please provide a valid GitHub repository URL."
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp(prefix="github_clone_")
    
    try:
        # Clone the repository
        Repo.clone_from(repo_url, temp_dir, depth=1)  # shallow clone for speed
        return temp_dir, None
        
    except GitCommandError as e:
        # Clean up temp directory on failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        
        error_msg = str(e)
        
        # Provide user-friendly error messages
        if "Authentication failed" in error_msg or "could not read Username" in error_msg:
            return None, "Repository is private or requires authentication. Only public repositories are supported."
        elif "Repository not found" in error_msg or "does not exist" in error_msg:
            return None, "Repository not found. Please check the URL and try again."
        elif "Network" in error_msg or "Could not resolve host" in error_msg:
            return None, "Network error. Please check your internet connection."
        else:
            return None, f"Failed to clone repository: {error_msg}"
            
    except Exception as e:
        # Clean up temp directory on failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        return None, f"Unexpected error: {str(e)}"


def cleanup_temp_directory(temp_dir: str):
    """
    Remove a temporary directory and all its contents.
    
    Args:
        temp_dir: Path to the temporary directory to remove
    """
    if temp_dir and os.path.exists(temp_dir):
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as e:
            print(f"Warning: Failed to clean up temporary directory {temp_dir}: {e}")
