# Generated by Django 4.2.16 on 2025-02-07 18:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_denselayer'),
    ]

    operations = [
        migrations.AddField(
            model_name='model',
            name='visibility',
            field=models.CharField(choices=[('private', 'Private'), ('public', 'Public')], default='private', max_length=10),
        ),
    ]
