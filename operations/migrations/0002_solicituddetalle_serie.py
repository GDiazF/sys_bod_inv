import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
        ('operations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='solicituddetalle',
            name='serie',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to='inventory.serie',
            ),
        ),
    ]
