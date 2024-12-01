from django.urls import path
from .views import *

urlpatterns = [
    # PROFILE HANDLING
    path("current-profile/", GetCurrentProfile.as_view(), name="current-profile"),
    
    # DATASET HANDLING
    path("my-datasets/", DatasetListProfile.as_view(), name="my-datasets"),
    path("datasets/delete/<int:pk>/", DatasetDelete.as_view(), name="delete-dataset"),
    path("dataset/<int:id>", GetDataset.as_view(), name="get-dataset"),

]