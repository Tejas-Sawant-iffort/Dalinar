# Generated by Django 4.2.16 on 2025-02-27 17:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0030_model_evaluated_accuracy_model_evaluated_on_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='model',
            name='evaluated_on_tensorflow',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='model',
            name='trained_on_tensorflow',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
