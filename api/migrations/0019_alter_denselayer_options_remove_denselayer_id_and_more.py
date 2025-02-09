# Generated by Django 4.2.16 on 2025-02-09 19:51

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('api', '0018_denselayer_polymorphic_ctype_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='denselayer',
            options={'base_manager_name': 'objects'},
        ),
        migrations.RemoveField(
            model_name='denselayer',
            name='id',
        ),
        migrations.RemoveField(
            model_name='denselayer',
            name='index',
        ),
        migrations.RemoveField(
            model_name='denselayer',
            name='layer_type',
        ),
        migrations.RemoveField(
            model_name='denselayer',
            name='model',
        ),
        migrations.RemoveField(
            model_name='denselayer',
            name='polymorphic_ctype',
        ),
        migrations.CreateModel(
            name='BaseModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('index', models.PositiveIntegerField(default=0)),
                ('layer_type', models.CharField(choices=[('dense', 'Dense'), ('conv2d', 'Conv2D')], default='dense', max_length=100)),
                ('model', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='layers', to='api.model')),
                ('polymorphic_ctype', models.ForeignKey(editable=False, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='polymorphic_%(app_label)s.%(class)s_set+', to='contenttypes.contenttype')),
            ],
            options={
                'abstract': False,
                'base_manager_name': 'objects',
            },
        ),
        migrations.AddField(
            model_name='denselayer',
            name='basemodel_ptr',
            field=models.OneToOneField(auto_created=True, default=0, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='api.basemodel'),
            preserve_default=False,
        ),
    ]
