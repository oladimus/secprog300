from django.middleware.csrf import CsrfViewMiddleware
from rest_framework.response import Response

# Custom csrf check function
def csrf_check(request):
    csrf_middleware = CsrfViewMiddleware(lambda req: None)
    reason = csrf_middleware.process_view(request, None, (), {})
    if reason:
        return Response({"detail": f"CSRF Failed: {reason}"}, status=403)
    return None