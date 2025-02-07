# Generated by Django 4.2.16 on 2025-02-07 15:02

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='DenseLayer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nodes_count', models.PositiveIntegerField(default=1)),
                ('model', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='layers', to='api.model')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
