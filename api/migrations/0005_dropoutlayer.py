# Generated by Django 4.2.16 on 2025-02-12 17:48

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_flattenlayer_delete_flatten'),
    ]

    operations = [
        migrations.CreateModel(
            name='DropoutLayer',
            fields=[
                ('layer_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='api.layer')),
                ('probability', models.FloatField(validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(1.0)])),
            ],
            options={
                'abstract': False,
                'base_manager_name': 'objects',
            },
            bases=('api.layer',),
        ),
    ]
