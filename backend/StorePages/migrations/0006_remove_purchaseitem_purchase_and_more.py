import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('StorePages', '0005_purchase_sale_purchaseitem_saleitem'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='purchaseitem',
            unique_together=None,
        ),
 migrations.RemoveField(
     model_name='purchaseitem',
     name='purchase',
 ),
        migrations.RemoveField(
            model_name='purchaseitem',
            name='product',
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254)),
                ('full_name', models.CharField(blank=True, max_length=255)),
                ('phone', models.CharField(blank=True, max_length=32)),
                ('street', models.CharField(blank=True, max_length=255)),
                ('house_number', models.CharField(blank=True, max_length=32)),
                ('city', models.CharField(blank=True, max_length=128)),
                ('postal_code', models.CharField(blank=True, max_length=32)),
                ('country', models.CharField(blank=True, max_length=128)),
                ('note', models.CharField(blank=True, max_length=255)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('at_location', 'At Processing Location'), ('shipped', 'Shipped'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='pending', max_length=32)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('customer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders', to=settings.AUTH_USER_MODEL)),
                ('sale', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order', to='StorePages.sale')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='StorePages.order')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='order_items', to='StorePages.product')),
            ],
            options={
                'unique_together': {('order', 'product')},
            },
        ),
        migrations.DeleteModel(
            name='Purchase',
        ),
        migrations.DeleteModel(
            name='PurchaseItem',
        ),
    ]
