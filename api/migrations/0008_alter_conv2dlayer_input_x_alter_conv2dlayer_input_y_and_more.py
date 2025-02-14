# Generated by Django 4.2.16 on 2025-02-14 10:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_alter_flattenlayer_input_x_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conv2dlayer',
            name='input_x',
            field=models.PositiveIntegerField(blank=True, default=None, null=True),
        ),
        migrations.AlterField(
            model_name='conv2dlayer',
            name='input_y',
            field=models.PositiveIntegerField(blank=True, default=None, null=True),
        ),
        migrations.AlterField(
            model_name='conv2dlayer',
            name='input_z',
            field=models.PositiveIntegerField(blank=True, default=None, null=True),
        ),
        migrations.AlterField(
            model_name='layer',
            name='activation_function',
            field=models.CharField(blank=True, choices=[('relu', 'ReLU'), ('softmax', 'Softmax')], default='', max_length=100),
        ),
        migrations.AlterField(
            model_name='layer',
            name='layer_type',
            field=models.CharField(choices=[('dense', 'Dense'), ('conv2d', 'Conv2D'), ('flatten', 'Flatten'), ('dropout', 'Dropout')], default='dense', max_length=100),
        ),
    ]
