import requests
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login
from django.contrib import messages
from rest_framework.response import Response
from django.db.models import Q, Count
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.urls import resolve
import json
from rest_framework.test import APIRequestFactory

from .serializers import *
from .models import *


# PROFILE HANDLING

class GetCurrentProfile(APIView):
    serializer_class = ProfileSerializer

    def get(self, request, format=None):
        if request.user.id == None:
            return Response('', status=status.HTTP_200_OK)
        profile = request.user.profile
        profileSerialized = ProfileSerializer(profile)
        data = profileSerialized.data
        data["datasetsCount"] = profile.datasets.count()
        
        return Response(data, status=status.HTTP_200_OK)


# DATASET HANDLING


class DatasetListPublic(generics.ListAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        search = self.request.GET.get("search")
        if search == None: search = ""
        datasets = Dataset.objects.filter(Q(visibility="public") & Q(name__contains=search))
        return datasets


class DatasetListProfile(generics.ListCreateAPIView):
    serializer_class = DatasetSerializer
    permission_classes  = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = user.profile
        datasets = profile.datasets
        
        search = self.request.GET.get("search")
        if (search):
            datasets = datasets.filter(Q(name__contains=search))

        return datasets


class GetDataset(APIView):
    serializer_class = DatasetSerializer
    lookup_url_kwarg = 'id'
    
    def get(self, request, *args, **kwargs):
        user = self.request.user
        if user.is_authenticated:
            dataset_id = kwargs[self.lookup_url_kwarg]
                
            if dataset_id != None:
                try:
                    dataset = Dataset.objects.get(Q(id=dataset_id) & Q(Q(visibility = "public") | Q(owner=user.profile)))
                    
                    datasetSerialized = self.serializer_class(dataset)
                    data = datasetSerialized.data
                    data["ownername"] = dataset.owner.name
                    
                    return Response(data, status=status.HTTP_200_OK)
                    
                except Dataset.DoesNotExist:
                    return Response({'Not found': 'No public dataset or dataset belonging to you was found with the id ' + str(dataset_id) + '.'}, status=status.HTTP_404_NOT_FOUND)        
            
            else:
                return Response({'Bad Request': 'Id parameter not found in call to GetDataset.'}, status=status.HTTP_400_BAD_REQUEST)
            
        else:
            return Response({'Unauthorized': 'Must be logged in to get datasets.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        
class GetDatasetPublic(APIView):
    serializer_class = DatasetSerializer
    lookup_url_kwarg = 'id' 
    
    def get(self, request, *args, **kwargs):

        dataset_id = kwargs[self.lookup_url_kwarg]
            
        if dataset_id != None:
            try:
                dataset = Dataset.objects.get(Q(id=dataset_id) & Q(Q(visibility = "public")))
                
                datasetSerialized = self.serializer_class(dataset)
                data = datasetSerialized.data
                data["ownername"] = dataset.owner.name
                
                return Response(data, status=status.HTTP_200_OK)
                
            except Dataset.DoesNotExist:
                return Response({'Not found': 'No public dataset was found with the id ' + str(dataset_id) + '.'}, status=status.HTTP_404_NOT_FOUND)        
        
        else:
            return Response({'Bad Request': 'Id parameter not found in call to GetDataset.'}, status=status.HTTP_400_BAD_REQUEST)

        
        
class CreateDataset(APIView):
    serializer_class = CreateDatasetSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, format=None):
        data = request.data
        data_dict = dict(data)
        
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            dataset_instance = serializer.save(owner=request.user.profile)
            
            labels = data_dict["labels"]
            if labels:
                create_element = CreateElement.as_view()
                create_label = CreateLabel.as_view()
                edit_element_label = EditElementLabel.as_view()
                
                factory = APIRequestFactory()
                for label in labels:
                    elements = data_dict[label]
                    
                    label_request = factory.post('/create-label/', data=json.dumps({"name": label,
                                                                                         "dataset": dataset_instance.id, 
                                                                                         "color": "#ffffff",
                                                                                         "keybind": ""}), content_type='application/json')
                    label_request.user = request.user
                    
                    label_response = create_label(label_request)
                    if label_response.status_code != 200:
                        return Response(
                            {'Bad Request': f'Error creating label {label}'},
                            status=label_response.status_code
                        )
                    
                    label_id = label_response.data["instance"].id
                    for element in elements:
                        element_request = factory.post("/create-element/", data={
                            "file": element,
                            "dataset": dataset_instance.id,
                        }, format="multipart")
                        element_request.user = request.user
                        
                        element_response = create_element(element_request)
                        if element_response.status_code != 200:
                            return Response(
                                {'Bad Request': 'Error creating element'},
                                status=element_response.status_code
                            )
                        
                        print(element_response.data)
                        element_id = element_response.data["instance"].id
                        print(f"element_id: {element_id}")
                        print(f"label_id: {label_id}")
                        
                        label_element_request = factory.post("/edit-element-label/", data=json.dumps({
                            "label": label_id,
                            "id": element_id
                            }), content_type='application/json')
                        label_element_request.user = request.user
                        
                        label_element_response = edit_element_label(label_element_request)
                        if label_element_response.status_code != 200:
                            return Response(
                                {'Bad Request': 'Error labelling element'},
                                status=label_element_response.status_code
                            )
                        

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({'Bad Request': 'An error occurred while creating dataset'}, status=status.HTTP_400_BAD_REQUEST)
    
    
class EditDataset(APIView):
    serializer_class = CreateDatasetSerializer
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):   # A put request may fit better, post for now
        name = request.data["name"]
        description = request.data["description"]
        image = request.data["image"]
        visibility = request.data["visibility"]
        dataset_id = request.data["id"]
        
        user = self.request.user
        
        if user.is_authenticated:
            try:
                dataset = Dataset.objects.get(id=dataset_id)
                
                if dataset.owner == user.profile:
                    if name: dataset.name = name
                    if description: dataset.description = description
                    if image: dataset.image = image
                    if visibility: dataset.visibility = visibility
                        
                    dataset.save()
                
                    return Response(None, status=status.HTTP_200_OK)
                
                else:
                    return Response({'Unauthorized': 'You can only edit your own datasets.'}, status=status.HTTP_401_UNAUTHORIZED)
            except Dataset.DoesNotExist:
                return Response({'Not found': 'Could not find dataset with the id ' + str(dataset_id) + '.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'Unauthorized': 'Must be logged in to edit datasets.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        
class DownloadDataset(APIView):
    parser_classes = [JSONParser]
    
    def post(self, request, format=None):
        dataset_id = request.data["id"]
        
        user = self.request.user
        
        if user.is_authenticated:
            try:
                dataset = Dataset.objects.get(id=dataset_id)
                
                dataset.downloaders.add(user.profile)
                
                return Response(None, status=status.HTTP_200_OK)
            except Dataset.DoesNotExist:
                return Response({"Not found": "Could not find dataset with the id " + str(dataset_id) + "."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"Unauthorized": "Did not increase download count as user is not signed in."}, status=status.HTTP_401_UNAUTHORIZED)
    
    
# ELEMENT HANDLING

class CreateElement(APIView):
    serializer_class = CreateElementSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, format=None):
        data = self.request.data
        serializer = self.serializer_class(data=data)
        
        if serializer.is_valid():
            
            dataset_id = data["dataset"]
            dataset = Dataset.objects.get(id=dataset_id)
            
            user = self.request.user
            
            if user.is_authenticated:
                
                if user.profile == dataset.owner:
                
                    instance = serializer.save(owner=request.user.profile)
                    return Response({"data": serializer.data, "instance": instance}, status=status.HTTP_200_OK)
                
                else:
                    return Response({'Unauthorized': 'You can only add elements to your own datasets.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            else:
                return Response({'Unauthorized': 'Must be logged in to create elements.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        else:
            return Response({"Bad Request": "An error occured while creating element"}, status=status.HTTP_400_BAD_REQUEST)
        
        
class EditElementLabel(APIView):   # Currently only used for labelling
    serializer_class = EditElementSerializer
    parser_classes = [JSONParser]

    def post(self, request, format=None):   # A put request may fit better, post for now
        label_id = request.data["label"]
        element_id = request.data["id"]
        
        user = self.request.user
        
        if user.is_authenticated:
            found_element = False
            try:
                element = Element.objects.get(id=element_id)
                found_element = True
                
                label = Label.objects.get(id=label_id)
                if element.owner == user.profile:
                    element.label = label
                    element.save()
                
                    return Response(ElementSerializer(element).data, status=status.HTTP_200_OK)
                
                else:
                    return Response({'Unauthorized': 'You can only edit your own elements.'}, status=status.HTTP_401_UNAUTHORIZED)
            except Element.DoesNotExist or Label.DoesNotExist:
                if found_element: return Response({'Not found': 'Could not find label with the id ' + str(label_id) + '.'}, status=status.HTTP_404_NOT_FOUND)
                return Response({'Not found': 'Could not find element with the id ' + str(element_id) + '.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'Unauthorized': 'Must be logged in to edit elements.'}, status=status.HTTP_401_UNAUTHORIZED)
      
      
class EditElement(APIView):
    serializer_class = EditElementSerializer
    parser_classes = [JSONParser]

    def post(self, request, format=None):   # A put request may fit better, post for now
        name = request.data["name"]
        element_id = request.data["id"]
        
        user = self.request.user
        
        if user.is_authenticated:
            try:
                element = Element.objects.get(id=element_id)
                
                if element.owner == user.profile:
                    if name:
                        element.name = name
                        
                    element.save()
                
                    return Response(ElementSerializer(element).data, status=status.HTTP_200_OK)
                
                else:
                    return Response({'Unauthorized': 'You can only edit your own elements.'}, status=status.HTTP_401_UNAUTHORIZED)
            except Element.DoesNotExist:
                return Response({'Not found': 'Could not find element with the id ' + str(element_id) + '.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'Unauthorized': 'Must be logged in to edit elements.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        
class RemoveElementLabel(APIView):
    serializer_class = EditElementSerializer
    parser_classes = [JSONParser]

    def post(self, request, format=None):   # A put request may fit better, post for now
        element_id = request.data["id"]
        user = self.request.user
        
        if user.is_authenticated:
            try:
                element = Element.objects.get(id=element_id)

                if element.owner == user.profile:
                    element.label = None
                    element.save()
                
                    return Response(None, status=status.HTTP_200_OK)
                
                else:
                    return Response({'Unauthorized': 'You can only edit your own elements.'}, status=status.HTTP_401_UNAUTHORIZED)
            except Element.DoesNotExist:
                return Response({'Not found': 'Could not find element with the id ' + str(element_id) + '.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'Unauthorized': 'Must be logged in to edit elements.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        
class DeleteElement(APIView):
    serializer_class = ElementSerializer
    
    def post(self, request, format=None):
        element_id = request.data["element"]
        
        user = self.request.user
        
        if user.is_authenticated:
            try:
                element = Element.objects.get(id=element_id)
                
                if element.owner == user.profile:
                    element.delete()
                    
                    return Response(None, status=status.HTTP_200_OK)
                
                else:
                    return Response({"Unauthorized": "You can only delete your own elements."}, status=status.HTTP_401_UNAUTHORIZED)
            except Label.DoesNotExist:
                return Response({"Not found": "Could not find element with the id " + str(element_id + ".")}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'Unauthorized': 'Must be logged in to delete elements.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        
# LABEL HANDLING

class CreateLabel(APIView):
    serializer_class = CreateLabelSerializer
    parser_classes = [JSONParser]
    
    def post(self, request, format=None):
        data = self.request.data
        serializer = self.serializer_class(data=data)
        
        if serializer.is_valid():
            
            dataset_id = data["dataset"]
            dataset = Dataset.objects.get(id=dataset_id)
            
            user = self.request.user
            
            if user.is_authenticated:
                if user.profile == dataset.owner:
                    instance = serializer.save(owner=request.user.profile)
                    return Response({"data": serializer.data, "instance": instance}, status=status.HTTP_200_OK)
                
                else:
                    return Response({'Unauthorized': 'Users can only add labels to their  own datasets.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            else:
                return Response({'Unauthorized': 'Users must be logged in to create labels.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        else:
            return Response({"Bad Request": "An error occured while creating label. Invalid input."}, status=status.HTTP_400_BAD_REQUEST)
        
        
class GetDatasetLabels(generics.ListAPIView):
    serializer_class = LabelSerializer
    permission_classes  = [AllowAny]
    
    def get_queryset(self):
        dataset = self.request.query_params.get("dataset", None)
        labels = []
        
        if dataset:
            labels = Label.objects.filter(dataset=int(dataset))
    
        return labels
    
    
class EditLabel(APIView):
    serializer_class = EditLabelSerializer
    parser_classes = [JSONParser]
    
    def post(self, request, format=None):
        label_id = request.data["label"]
        name = request.data["name"]
        color = request.data["color"]
        keybind = request.data["keybind"]
        
        user = self.request.user
        
        if user.is_authenticated:
            try:
                label = Label.objects.get(id=label_id)
                
                if label.owner == user.profile:
                    label.name = name
                    label.color = color
                    label.keybind = keybind
                    label.save()
                    
                    return Response(None, status=status.HTTP_200_OK)
                
                else:
                    return Response({"Unauthorized": "You can only edit your own labels."}, status=status.HTTP_401_UNAUTHORIZED)
            except Label.DoesNotExist:
                return Response({"Not found": "Could not find label with the id " + str(label_id + ".")}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'Unauthorized': 'Must be logged in to edit labels.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        
class DeleteLabel(APIView):
    serializer_class = LabelSerializer
    
    def post(self, request, format=None):
        label_id = request.data["label"]
        
        user = self.request.user
        
        if user.is_authenticated:
            try:
                label = Label.objects.get(id=label_id)
                
                if label.owner == user.profile:
                    label.delete()
                    
                    return Response(None, status=status.HTTP_200_OK)
                
                else:
                    return Response({"Unauthorized": "You can only delete your own labels."}, status=status.HTTP_401_UNAUTHORIZED)
            except Label.DoesNotExist:
                return Response({"Not found": "Could not find label with the id " + str(label_id + ".")}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'Unauthorized': 'Must be logged in to delete labels.'}, status=status.HTTP_401_UNAUTHORIZED)