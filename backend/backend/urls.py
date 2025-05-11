"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from api.views import (
    CustomAdminLoginView,
    CreateUserView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CheckAuthenticationView,
    logout_view,
    FriendListView,
    FriendRequestView,
    PendingFriendRequestsView,
    RespondToFriendRequestView,
    SentFriendRequestsView,
    delete_friend,
    UpdateUserView,
    MessageView,
)

admin.site.login = CustomAdminLoginView.as_view()

urlpatterns = [
    path("notadmin/", admin.site.urls),
    path("api/user/register/", CreateUserView.as_view(), name="register"),
    path("api/token/", CustomTokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", CustomTokenRefreshView.as_view(), name="refresh_token"),
    path("api/auth-check/", CheckAuthenticationView.as_view(), name="auth_check"),
    path("api/user/logout/", logout_view, name="logout"),
    path("api/friends/", FriendListView.as_view(), name="friend_list"),
    path(
        "api/friendrequest/send/",
        FriendRequestView.as_view(),
        name="send_friendrequest",
    ),
    path(
        "api/friendrequest/respond/<int:pk>/",
        RespondToFriendRequestView.as_view(),
        name="respond_friendrequest",
    ),
    path(
        "api/friendrequest/view/",
        PendingFriendRequestsView.as_view(),
        name="friendrequests_view",
    ),
    path(
        "api/friendrequest/sent/",
        SentFriendRequestsView.as_view(),
        name="friendrequests_sent_view",
    ),
    path("api/friend/delete/", delete_friend, name="del_friend"),
    path("api/user/update/", UpdateUserView.as_view(), name="update_user"),
    path("api/message/", MessageView.as_view(), name="message"),
]
