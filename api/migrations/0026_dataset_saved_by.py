# Generated by Django 4.2.16 on 2025-02-22 07:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_remove_conv2dlayer_input_x_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='saved_by',
            field=models.ManyToManyField(blank=True, related_name='saved_datasets', to='api.profile'),
        ),
    ]
