# Generated by Django 4.2.16 on 2025-02-09 13:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_model_downloaders'),
    ]

    operations = [
        migrations.AddField(
            model_name='denselayer',
            name='layer_type',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
