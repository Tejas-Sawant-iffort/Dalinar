# Generated by Django 4.2.16 on 2025-02-04 12:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_alter_element_options_element_index'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='currentIdx',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
