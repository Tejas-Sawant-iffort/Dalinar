# Generated by Django 4.2.16 on 2025-02-18 15:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0019_alter_rescalinglayer_scale'),
    ]

    operations = [
        migrations.AddField(
            model_name='model',
            name='loss_function',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='model',
            name='optimizer',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
