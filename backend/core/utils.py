"""
Utility functions for SevisConnectED
"""
from typing import Dict, Any
from rest_framework.response import Response
from rest_framework import status


def format_api_response(data: Any = None, message: str = None, success: bool = True) -> Dict[str, Any]:
    """
    Format consistent API responses according to PRD format.
    
    Args:
        data: Response data
        message: Optional message
        success: Whether the request was successful
        
    Returns:
        Formatted response dictionary
    """
    response = {
        "status": "success" if success else "error",
    }
    
    if data is not None:
        response["data"] = data
    
    if message:
        response["message"] = message
    
    return response


def success_response(data: Any = None, message: str = None, http_status: int = status.HTTP_200_OK) -> Response:
    """Create a success response"""
    return Response(format_api_response(data=data, message=message, success=True), status=http_status)


def error_response(message: str, http_status: int = status.HTTP_400_BAD_REQUEST) -> Response:
    """Create an error response"""
    return Response(format_api_response(message=message, success=False), status=http_status)

