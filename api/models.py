from django.db import models, transaction
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.core.validators import FileExtensionValidator
import os
from django.core.validators import MaxLengthValidator, MinValueValidator, MaxValueValidator

from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import pillow_avif # Adds .avif support
from polymorphic.models import PolymorphicModel


ALLOWED_IMAGE_FILE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"]
ALLOWED_TEXT_FILE_EXTENSIONS = ["txt", "doc", "docx"]


class Profile(models.Model):    # Extends default User class
    user = models.OneToOneField(User, primary_key=True, verbose_name='user', related_name='profile', on_delete=models.CASCADE)
    name = models.CharField(max_length=30, blank=True, null=True, unique=True)
    
    def __str__(self):
        return self.name
    
@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance, name=instance.username)

@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()
    
    
# DATASETS

class Dataset(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="datasets")
    image = models.ImageField(upload_to='images/', null=True)
    imageSmall = models.ImageField(upload_to="images/", null=True)
    downloaders = models.ManyToManyField(Profile, related_name="downloaded_datasets", blank=True)
    saved_by = models.ManyToManyField(Profile, related_name="saved_datasets", blank=True)
    verified = models.BooleanField(default=False)
    keywords = models.JSONField(
        default=list,
        validators=[MaxLengthValidator(3)],
        help_text="A list of up to 3 keywords for the dataset.",
        blank=True
    )
    
    imageHeight = models.PositiveIntegerField(null=True, blank=True)    # If specified will resize image files uploaded
    imageWidth = models.PositiveIntegerField(null=True, blank=True)     # If specified will resize image files uploaded
        
    VISIBILITY_CHOICES = [
        ("private", "Private"),
        ("public", "Public")
    ]
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default="private")
    
    DATATYPE_CHOICES = [
        ("classification", "Classification"),
        ("area", "Area")
    ]
    datatype = models.CharField(max_length=20, choices=DATATYPE_CHOICES, default="Classification", blank=True, null=True)   # Used for image datasets
    
    DATASET_TYPE_CHOICES = [
        ("image", "Image"),
        ("text", "Text")
    ]
    dataset_type = models.CharField(max_length=20, choices=DATASET_TYPE_CHOICES, default="Image")
    
    def __str__(self):
        return self.name + " - " + self.owner.name + " (" + self.dataset_type + ")"


@receiver(post_delete, sender=Dataset)
def delete_dataset_image(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)
        instance.imageSmall.delete(save=False)
    
# LABELS
# Elements in datasets, such as files, are given labels
    
class Label(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="labels", null=True)
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="labels", null=True)
    color = models.CharField(max_length=7, default="#ffffff") # Hexadecimal format -- #000000
    keybind = models.CharField(max_length=20, blank=True)
    index = models.PositiveIntegerField(default=0)  # Specifies the order of labels, updated when reordering label list in datasets
        
    def __str__(self):
        return self.name + " - " + self.dataset.name

    class Meta:
        ordering = ["index"]


# ELEMENTS
# Datasets contain elements, which can be e.g. files

def element_file_path(instance, filename):
    """Generate a dynamic path for file uploads based on dataset ID and name."""
    if instance.dataset:
        dataset_dir = f"files/{instance.dataset.id}-{instance.dataset.name}"
    else:
        dataset_dir = "files/unknown_dataset"  # Fallback if dataset is missing

    return os.path.join(dataset_dir, filename)


class Element(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="elements", null=True)
    owner = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="elements", null=True)
    name = models.CharField(max_length=100)
    file = models.FileField(upload_to=element_file_path, null=True, validators=[FileExtensionValidator(allowed_extensions=ALLOWED_IMAGE_FILE_EXTENSIONS + ALLOWED_TEXT_FILE_EXTENSIONS)])
    
    label = models.ForeignKey(Label, on_delete=models.SET_NULL, related_name="labels", blank=True, null=True)
    
    imageHeight = models.PositiveIntegerField(blank=True, null=True)    # Only used if file is image
    imageWidth = models.PositiveIntegerField(blank=True, null=True)     # Only used if file is image
    
    index = models.PositiveIntegerField(default=0)  # Specifies the order of elements, updated when reordering element list in datasets
    
    def __str__(self):
        return self.name + " - " + self.dataset.name
    
    def save(self, *args, **kwargs):

        # If a new file is uploaded
        if self.file and not self.name:
            # Set the name field to the file's name (without the path)
            self.name = os.path.basename(self.file.name)
            
            ext = self.file.name.split(".")[-1].lower()
            if ext in ALLOWED_IMAGE_FILE_EXTENSIONS:
                try:
                    with Image.open(self.file) as img:
                        self.imageWidth, self.imageHeight = img.size
                        
                        # Check if resizing is needed, to prevent too large images
                        max_size = 1024
                        if self.imageWidth > max_size or self.imageHeight > max_size:
                            # Calculate new size while preserving aspect ratio
                            ratio = min(max_size / self.imageWidth, max_size / self.imageHeight)
                            new_size = (int(self.imageWidth * ratio), int(self.imageHeight * ratio))

                            # Resize image
                            img = img.resize(new_size, Image.Resampling.LANCZOS)

                            # Save resized image to file field
                            img_io = BytesIO()
                            img_format = "JPEG" if ext in ["jpg", "jpeg"] else "PNG"
                            img.save(img_io, format=img_format, quality=90)  # Adjust quality if needed

                            # Replace the uploaded file with the resized image
                            old_name = self.file.name
                            self.file.delete(save=False)
                            self.file.save(old_name, ContentFile(img_io.getvalue()), save=False)

                            # Update image size attributes
                            self.imageWidth, self.imageHeight = new_size
                            
                        
                except Exception as e:
                    print(f"Error processing image: {e}")
                    self.imageWidth, self.imageHeight = None, None    
            
        super().save(*args, **kwargs)
        
    class Meta:
        ordering = ["index"]
        
        
@receiver(post_delete, sender=Element)
def delete_element_file(sender, instance, **kwargs):
    if instance.file:
        instance.file.delete(save=False)


# AREAS
class Area(models.Model):   # Only used for datasets of datatype "area"
    label = models.ForeignKey(Label, on_delete=models.CASCADE, related_name="areas", null=True)
    element = models.ForeignKey(Element, on_delete=models.CASCADE, related_name="areas", null=True)
    area_points = models.JSONField(default=list)  # Store as a list of [x, y] points
    
    def __str__(self):
        return "Element: " + self.element.name + ", Label: " + self.label.name + ". Points: " + str(self.area_points)
    
    
# MODELS
class Model(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="models")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='images/', null=True)
    imageSmall = models.ImageField(upload_to="images/", null=True)
    downloaders = models.ManyToManyField(Profile, related_name="downloaded_models", blank=True)
    verified = models.BooleanField(default=False)
    
    MODEL_TYPE_CHOICES = [
        ("image", "Image"),
        ("text", "Text")
    ]
    model_type = models.CharField(max_length=20, choices=MODEL_TYPE_CHOICES, default="Image")
    
    trained_on = models.ForeignKey(Dataset, on_delete=models.SET_NULL, related_name="trained_with", blank=True, null=True)   # Last trained on
    trained_on_tensorflow = models.CharField(max_length=100, blank=True, null=True)  # Used when training on TensorFlow datasets
    trained_accuracy = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(1.0)], blank=True, null=True)
    
    evaluated_on = models.ForeignKey(Dataset, on_delete=models.SET_NULL, related_name="evaluated_with", blank=True, null=True)
    evaluated_on_tensorflow = models.CharField(max_length=100, blank=True, null=True)   # Used when evaluating on TensorFlow datasets
    evaluated_accuracy = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(1.0)], blank=True, null=True)
    
    VISIBILITY_CHOICES = [
        ("private", "Private"),
        ("public", "Public")
    ]
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default="private")
    
    model_file = models.FileField(upload_to="models/", null=True)
    optimizer = models.CharField(max_length=100, blank=True, null=True)
    loss_function = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return self.name + " - " + self.owner.name
    
    
@receiver(post_delete, sender=Model)
def delete_model_files(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)
        instance.imageSmall.delete(save=False)
    if instance.model_file:
        instance.model_file.delete(save=False)
    
    
# LAYERS
class AbstractLayer(models.Model):
    model = models.ForeignKey(Model, on_delete=models.CASCADE, related_name="layers", null=True, blank=True)
    index = models.PositiveIntegerField(default=0)
    
    LAYER_CHOICES = [
        ("dense", "Dense"),
        ("conv2d", "Conv2D"),
        ("maxpool2d", "MaxPool2d"),
        ("flatten", "Flatten"),
        ("dropout", "Dropout")
    ]
    layer_type = models.CharField(max_length=100, choices=LAYER_CHOICES, default="dense")
    
    ACTIVATION_CHOICES = [
        ("relu", "ReLU"),
        ("softmax", "Softmax")
    ]
    activation_function = models.CharField(max_length=100, choices=ACTIVATION_CHOICES, default="", blank=True)
    
    input_x = models.PositiveIntegerField(null=True)
    input_y = models.PositiveIntegerField(null=True)
    input_z = models.PositiveIntegerField(null=True)
    
    class Meta:
        abstract = True  # Marks this model as abstract  
        
        
# Concrete Model (Inherit from PolymorphicModel)
class Layer(PolymorphicModel, AbstractLayer):
    class Meta:
        ordering = ["index"]

        
class DenseLayer(Layer):
    nodes_count = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        res = f"Dense ({self.nodes_count})"
        if self.model: res += " - " + self.model.name
        return res
    
    
class Conv2DLayer(Layer):
    filters = models.PositiveIntegerField(default=1)
    kernel_size = models.PositiveIntegerField(default=3)
    
    def __str__(self):
        res = f"Conv2D ({self.filters}, {self.kernel_size})"
        if self.model: res += " - " + self.model.name
        return res
    
    
class MaxPool2DLayer(Layer):
    pool_size = models.PositiveIntegerField(null=True)
    
    def __str__(self):
        res = "MaxPool2DLayer - " + str(self.pool_size)
        if self.model: res += " - " + self.model.name
        return res
    
    
class FlattenLayer(Layer):
    def __str__(self):
        res = "Flatten"
        if self.input_x:
            res += f" ({self.input_x}, {self.input_y})"
        if self.model:
            res += " - " + self.model.name
            
        return res
    
    
class DropoutLayer(Layer):
    rate = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    
    def __str__(self):
        res = f"Dropout ({self.rate})"
        if self.model: res += " - " + self.model.name
        return res
    
    
class RescalingLayer(Layer):
    scale = models.CharField(max_length=100)
    offset = models.FloatField()
    
    def __str__(self):
        res = f"Rescaling ({self.scale}, {self.offset})"
        if self.model: res += " - " + self.model.name
        return res
    
    def clean(self):
        """Ensure that the scale can be evaluated to a valid number."""
        try:
            # Evaluate safely (avoid eval() to prevent arbitrary code execution)
            compiled_expr = compile(self.scale, "<string>", "eval")
            result = eval(compiled_expr, {"__builtins__": {}}, {})
            if not isinstance(result, (int, float)):
                raise ValueError("Scale must evaluate to a number.")
        except Exception as e:
            raise ValueError(f"Invalid scale expression: {self.scale}. Error: {str(e)}")

    def get_scale_value(self):
        """Evaluate the scale string to return the computed float value."""
        return eval(self.scale, {"__builtins__": {}}, {})
    
    
class RandomFlipLayer(Layer):
    MODE_CHOICES = [
        ("horizontal_and_vertical", "horizontal_and_vertical"),
        ("horizontal", "horizontal"),
        ("vertical", "vertical"),
    ]
    mode = models.CharField(max_length=100, choices=MODE_CHOICES, default="horizontal_and_vertical")
    
    def __str__(self):
        res = f"RandomFlip ({self.mode})"
        if self.model: res += " - " + self.model.name
        return res
    
    
class ResizingLayer(Layer):
    output_x = models.PositiveIntegerField()
    output_y = models.PositiveIntegerField()
    
    def __str__(self):
        res = f"Resizing ({self.output_x}, {self.output_y})"
        if self.model: res += " - " + self.model.name
        return res